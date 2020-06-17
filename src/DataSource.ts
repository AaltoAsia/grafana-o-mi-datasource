import defaults from 'lodash/defaults';
import _ from 'lodash';
import * as omi from './omi';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  DataQueryError,
} from '@grafana/data';
import { getBackendSrv, BackendSrvRequest } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions, defaultQuery, SimpleSuggestion } from './types';

interface ResponseI extends Response {
  data: string;
  query: string;
}
//export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  settings: DataSourceInstanceSettings;
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.settings = instanceSettings;
    this.url = instanceSettings.url || '';
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    console.log('QUERY', options);
    //const { range } = options;
    //const from = range!.from.valueOf();
    //const to = range!.to.valueOf();
    //// Return a constant for each query.
    //const data = options.targets.map(target => {
    //  const query = defaults(target, defaultQuery);
    //  return new MutableDataFrame({
    //    refId: query.refId,
    //    fields: [
    //      { name: 'Time', values: [from, to], type: FieldType.time },
    //      { name: 'Value', values: [query.newest, query.newest], type: FieldType.number },
    //    ],
    //  });
    //});
    //return { data };

    const odf = omi.createOdfDocument();
    let refIds: Map<string, string> = new Map();

    for (let target of options.targets) {
      const query = defaults(target, defaultQuery);
      refIds.set(query.queryText, query.refId); // Path -> refId
      const segments = _.split(query.queryText, '/');
      let parent: Node = odf.documentElement;
      for (let parentId of _.initial(segments)) {
        //(segments, 0,segments.length-1)) {
        let newObject = omi.createOdfObject(odf, parentId);
        parent.appendChild(newObject);
        parent = newObject;
      }
      parent.appendChild(omi.createOdfInfoItem(odf, _.last(segments) || ''));
    }

    let omiRequest = `<omiEnvelope xmlns="http://www.opengroup.org/xsd/omi/1.0/" version="1.0" ttl="0">
        <read msgformat="odf" newest="${options.maxDataPoints}"
          begin="${options.range.from.toISOString()}" end="${options.range.to.toISOString()}">
          <msg>
            ${odf.documentElement.outerHTML}
          </msg>
        </read>
      </omiEnvelope>`;

    const result = this.doRequest({
      url: this.url,
      data: omiRequest,
      method: 'POST',
    })
      .then(response => {
        const envelope = omi.parseXml(response.data);
        if (envelope === null) {
          const error: DataQueryError = {
            message: 'Could not parse query result, check browser console', // TODO: get error message
            //refId : options.targets,
          };
          throw error;
        }
        //var results = omi.evaluateXPath(envelope, '//omi:result');
        const items = omi.evaluateXPath(envelope, '//odf:InfoItem') as Element[];
        const data = _(items)
          .map(item => {
            //const [times, values] = _.reduce(omi.evaluateXPath(item, './odf:value') as Element[],
            //  ([times: string[], values: number[]], value, key) => {
            //          times.push(value.textContent);
            //          values.push(_.round(value.attributes.getNamedItem('unixTime').value * 1000));
            //          return [times, values];
            //});
            const times: number[] = [],
              values: string[] = [];
            for (let value of omi.evaluateXPath(item, './odf:value') as Element[]) {
              times.push(_.round(Number(value.attributes.getNamedItem('unixTime')?.value) * 1000));
              values.push(value.textContent || '');
            }
            return new MutableDataFrame({
              refId: refIds.get(omi.elemOdfPath(item)),
              fields: [
                { name: 'Time', values: times, type: FieldType.time },
                { name: 'Value', values: values, type: FieldType.number }, // FIXME: if string or boolean
              ],
            });
          })
          .value();
        console.log('RESPONSE HANDLER', envelope, items, data);
        return { data };
      })
      .catch(err => {
        console.error(err);
        return { data: [] };
      });
    //  const query = defaults(target, defaultQuery);
    //  return new MutableDataFrame({
    //    refId: query.refId,
    //    fields: [
    //      { name: 'Time', values: [from, to], type: FieldType.time },
    //      { name: 'Value', values: [query.newest, query.newest], type: FieldType.number },
    //    ],
    //  });

    return result;
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return this.doRequest({
      url: this.url,
      method: 'POST',
      data: `
        <omiEnvelope xmlns="http://www.opengroup.org/xsd/omi/1.0/" version="1.0" ttl="20">
          <read msgformat="odf">
            <msg>
              <Objects xmlns="http://www.opengroup.org/xsd/odf/1.0/">
                <Object>
                  <id>OMI-Service</id>
                </Object>
              </Objects>
            </msg>
          </read>
        </omiEnvelope>
        `,
    }).then(response => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      } else {
        return { status: 'failure', message: 'Please check that Access is set to browser.', title: 'Failure' };
      }
    });
  }

  async doRequest(options: BackendSrvRequest) {
    options.withCredentials = this.settings.withCredentials;
    //options.headers = this.settings.headers;

    return getBackendSrv().datasourceRequest(options);
  }

  mapToTextValue(parent: string) {
    return function(result: string): SimpleSuggestion[] {
      console.log('D QUERY RES:', result);

      const doc = omi.parseXml(result);
      //console.log(doc, doc.children.length, _.includes(['Object','Objects'], doc.children[0].nodeName), doc.children[0].nodeName);
      if (_.isObject(doc) && doc.children.length === 1 && _.includes(['Object', 'Objects'], doc.children[0].nodeName)) {
        const root = doc.children[0];

        return _(omi.getObjectChildren(root))
          .map(elem => {
            const id = omi.evaluateXPath(elem, './@name|./odf:id/text()')[0].textContent || '';
            return {
              text: id,
              value: (parent.length > 0 ? _.trimEnd(parent, '/') + '/' : '') + id,
              type: elem.nodeName,
            };
          })
          .value();
      } else {
        // error or empty
        return [];
      }

      //return _.map(result.data, (d, i) => {
      //  if (d && d.text && d.value) {
      //    return { text: d.text, value: d.value };
      //  } else if (_.isObject(d)) {
      //    return { text: d, value: i};
      //  }
      //  return { text: d, value: d };
      //});
    };
  }
  //mapPromiseToText(query: string, response: ResponseI): Promise<SimpleSuggestion[]> {
  //  return response.data.then(this.mapToTextValue(query));
  //}

  metricFindQuery(query: string): Promise<SimpleSuggestion[]> {
    console.log('DISCOVERY', query);
    //target: this.templateSrv.replace(query, null, 'regex')
    const odfPath = _.isString(query) ? query : '';

    const queries = [odfPath, odfPath.substring(0, odfPath.lastIndexOf('/'))];
    const responses = Promise.all(
      queries.map(query =>
        this.doRequest({
          url: _.trimEnd(this.url, '/') + '/Objects/' + query,
          method: 'GET',
        })
          .catch(e => e)
          .then(x => ({ ...x, query }))
      )
    );

    const results = responses.then((rawResponses: ResponseI[]) => {
      console.log('D resp', rawResponses);
      return _(rawResponses)
        .map(response => {
          if (response.status === 200) {
            return this.mapToTextValue(response.query)(response.data);
          }
          return [];
        })
        .flatten()
        .uniq()
        .value();
    });

    return results;
  }
}
