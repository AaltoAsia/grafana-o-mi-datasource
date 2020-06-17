import React, { PureComponent } from 'react';
import _ from 'lodash';

import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
//import { MyDataSourceOptions } from './types';

import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourceSettings, DataSourceJsonData } from '@grafana/data';

//import { LegacyForms } from '@grafana/ui';
//const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<DataSourceJsonData> {}
interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  //const settingsMock: DataSourceSettings<any, any> = {
  //  id: 4,
  //  orgId: 1,
  //  name: 'aalto-asia-o-mi',
  //  type: 'O-MI',
  //  typeLogoUrl: '',
  //  access: 'direct',
  //  url: 'http://localhost:8080',
  //  password: '',
  //  user: '',
  //  database: '',
  //  basicAuth: false,
  //  basicAuthUser: '',
  //  basicAuthPassword: '',
  //  withCredentials: false,
  //  isDefault: false,
  //  jsonData: {
  //    timeInterval: '15s',
  //    httpMode: 'POST',
  //    keepCookies: ['cookie1', 'cookie2'],
  //  },
  //  secureJsonData: {
  //    password: true,
  //  },
  //  readOnly: true,
  //};

  updateDataSourceSettings = (config: DataSourceSettings<DataSourceJsonData, {}>) => {
    const { onOptionsChange, options } = this.props;
    config.url = _.trimEnd(config.url, ' ');

    onOptionsChange({ ...options, ...config });
  };

  render() {
    const { options } = this.props;
    return (
      <DataSourceHttpSettings
        defaultUrl="http://localhost:8080"
        dataSourceConfig={options}
        onChange={this.updateDataSourceSettings}
        showAccessOptions={true}
      />
    );
  }
}
