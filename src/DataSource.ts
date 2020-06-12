import defaults from 'lodash/defaults';
import _ from 'lodash';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv, BackendSrvRequest } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

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
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Return a constant for each query.
    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Time', values: [from, to], type: FieldType.time },
          { name: 'Value', values: [query.newest, query.newest], type: FieldType.number },
        ],
      });
    });

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return this.doRequest({
      url: this.settings.url + '/',
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

  mapToTextValue(parent: string) {return function(result: string) {
    console.log("D QUERY RES:", result.data);

    var doc = omi.parseXml(result.data);
    //console.log(doc, doc.children.length, _.includes(["Object","Objects"], doc.children[0].nodeName), doc.children[0].nodeName);
    if (_.isObject(doc) &&
        doc.children.length === 1 &&
        _.includes(["Object","Objects"], doc.children[0].nodeName)){

      var root = doc.children[0];


      return _(omi.getObjectChildren(root))
        .map(x => omi.getOdfId(x))
        .map(x => {console.log(x); return x;})
        .map(id => ({ text: id, value: parent + "/" + id }))
        .value();
    } else {
      // error or empty
      return []
    }

    //return _.map(result.data, (d, i) => {
    //  if (d && d.text && d.value) {
    //    return { text: d.text, value: d.value };
    //  } else if (_.isObject(d)) {
    //    return { text: d, value: i};
    //  }
    //  return { text: d, value: d };
    //});
  }}

  metricFindQuery(query: string) {
    console.log('DISCOVERY', query);
    //target: this.templateSrv.replace(query, null, 'regex')
    var odfPath = _.isString(query) ? '/Objects/' + query : '';

    return this.doRequest({
      url: this.url + odfPath,
      method: 'GET',
    }).then(response => {
      console.log('D resp', response);
      if (response.status !== 200) {
        this.doRequest({
          url: this.url + odfPath.substring(0, _.lastIndexOf(odfPath, '/')),
          method: 'GET',
        }).then(resp => {
          console.log('D respresp', resp);
          return this.mapToTextValue(query)(resp);
        });
      } else {
        console.log('D success');
        return this.mapToTextValue(query)(response);
      }
    });
  }

}
