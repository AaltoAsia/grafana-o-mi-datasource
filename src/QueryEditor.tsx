import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, QueryField, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  //onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  onQueryTextChange = (value: string) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: value });
  };

  onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, newest: parseFloat(event.target.value) });
    onRunQuery(); // executes the query
  };

  onTypeahead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    const { value } = typeahead;

    console.log('handleTypeahead', typeahead);

    return { suggestions: [] };
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryText, newest } = query;

    // cleanText= (string) => string // clean query for typeahead
    return (
      <div className="gf-form">
        <label className="gf-form-label">/Objects/</label>
        <QueryField
          query={queryText || ''}
          onChange={this.onQueryTextChange}
          portalOrigin="o-mi"
          onTypeahead={this.onTypeahead}
          onBlur={this.props.onBlur}
          onRunQuery={this.props.onRunQuery}
          placeholder="Enter an O-DF path or select from suggestions (run with Shift+Enter)"
        />
        <FormField
          width={2}
          value={newest}
          onChange={this.onConstantChange}
          label="newest"
          type="number"
          step="1"
          tooltip="Not used yet"
        />
      </div>
    );
  }
}
