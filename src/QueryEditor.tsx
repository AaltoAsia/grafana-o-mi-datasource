import defaults from 'lodash/defaults';
import _ from 'lodash';
//import { Dictionary } from 'lodash';

import React, { ChangeEvent, PureComponent } from 'react';
import { QueryField, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery, SimpleSuggestion } from './types';
import { Editor } from 'slate';

//const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  //onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  onQueryTextChange = (value: string) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryPath: _.trimStart(value, '/') });
  };
  onOdfTypeChange = (objectOrInfo: string) => {
    const { onChange, query } = this.props;
    onChange({ ...query, odfType: objectOrInfo });
  };

  onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, newest: parseFloat(event.target.value) });
    onRunQuery(); // executes the query
  };

  onTypeahead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    const { text } = typeahead;
    const { datasource } = this.props;

    const resultPromise = datasource._metricFindQuery(text); //text.slice(0, text.lastIndexOf('/')));
    return resultPromise.then(queryResults => {
      const { suggestions, type } = queryResults;
      this.onOdfTypeChange(type);

      const results = _.groupBy(suggestions, 'type');
      let createGroup = (gType: string) => ({
        label: gType,
        items: results[gType].map((s: SimpleSuggestion) => ({
          label: s.text,
          filterText: s.value,
          insertText: s.value,
        })),
      });
      const suggestionGroups = Object.keys(results).map(createGroup);

      console.log('handleTypeahead', typeahead, suggestionGroups);

      return { suggestions: suggestionGroups };
    });
  };
  //onWillApplySuggestion = (suggestion: string, state: SuggestionsState) => {
  //  console.log('APPLY SUGGESTION', suggestion, state);
  //  return suggestion;
  //};
  onClick = (event: Event, editor: Editor, next: () => any) => {
    console.log('CLICK', this, editor);

    //const { onChange, query } = this.props;
    ////const { query } = this.props;
    //if (_.isEmpty(query.queryPath)) {
    //  editor.insertText('/');
    //  //onChange({ ...query, queryPath: '/' });
    //}
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryPath } = query;

    // cleanText= (string) => string // clean query for typeahead
    return (
      <div className="gf-form">
        <label className="gf-form-label">/Objects</label>
        <QueryField
          query={queryPath || ''}
          onChange={this.onQueryTextChange}
          portalOrigin="o-mi"
          onTypeahead={this.onTypeahead}
          //onWillApplySuggestion={this.onWillApplySuggestion}
          onClick={this.onClick}
          onBlur={this.props.onBlur}
          onRunQuery={this.props.onRunQuery}
          placeholder="Enter an O-DF path or select from suggestions (run with Shift+Enter)"
        />
      </div>
    );
  }
}
