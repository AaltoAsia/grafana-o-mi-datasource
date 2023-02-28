import React, { Component, PureComponent } from 'react';
import 'jstree';
import $ from 'jquery';
import TreeView from 'react-simple-jstree';



export interface OdfTreeProps {
  selectedOdfPaths: string[];
}

export class OdfTree extends Component<OdfTreeProps> {
  odfTreeSettings: any;
  const icon = {
    objects: "glyphicon glyphicon-tree-deciduous",
    object: "glyphicon glyphicon-folder-open",
    method: "glyphicon glyphicon-flash",
    infoitem: "glyphicon glyphicon-apple",
    metadata: "glyphicon glyphicon-info-sign",
    description: "glyphicon glyphicon-info-sign"
  };
  constructor(props: OdfTreeProps) {
    super(props);
    this.odfTreeSettings = {
      plugins: ["checkbox", "types", "contextmenu", "sort"],
      core: {
        error: function(msg:string) {
          return console.log(msg);
        },
        force_text: true,
        check_callback: true,
        data: function(plainNode: HTMLElement, callback: (input:any[]) => void): void {
          if (plainNode.id === '#') { // root
            callback.call(this, [
              {
                id: "Objects",
                text: "Objects",
                state: {
                  opened: false
                },
                type: "objects",
                parent: "#",
                children: true
              }
            ]);
            return;
          }
          const that = this;
          const tree: JSTree = ; // XXX TODO: WebOmi.consts.odfTreeDom.jstree();
          const node: JQuery<HTMLElement> = tree.get_node(node, true); // get dom
          const parents = $.makeArray(node.parentsUntil(WebOmi.consts.odfTreeDom, "li"));
          parents.reverse();
          parents.push(node);
          parents = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = parents.length; i < len; i++) {
              node = parents[i];
              results.push(encodeURIComponent(tree.get_node(node).text));
            }
            return results;
          })();
          path = parents.join('/');
          serverUrl = my.serverUrl.val();
          serverUrl = serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
          xhr = $.get({
            url: serverUrl + path,
            dataType: "xml",
            cache: false,
            success: (function(parentPath) {
              return function(xml) {
                var child, children, data;
                data = WebOmi.formLogic.OdfToJstree(xml.documentElement, path);
                children = (function() {
                  var i, len, ref, results;
                  ref = data.children;
                  results = [];
                  for (i = 0, len = ref.length; i < len; i++) {
                    child = ref[i];
                    switch (child.type) {
                      case "objects":
                      case "object":
                        child.children = true; // tell jstree that there can be children
                    }
                    results.push(child);
                  }
                  return results;
                })();
                return callback.call(that, data.children);
              };
            })(path)
          });
          return xhr.fail(function(xhr, msg, err) {
            WebOmi.debug(["O-DF GET fail", xhr, msg, err]);
            return alert(`Failed to get Object(s): ${msg}; ${err}\n Depending on the error, check internet and server connection (to the url in the Server box) or data format might be incompatible.`);
          });
        }
      },
      types: {
        default: {
          icon: "odf-objects " + my.icon.objects,
          valid_children: ["object"]
        },
        object: {
          icon: "odf-object " + my.icon.object,
          valid_children: ["object", "infoitem", "description"]
        },
        objects: {
          icon: "odf-objects " + my.icon.objects,
          valid_children: ["object"]
        },
        infoitem: {
          icon: "odf-infoitem " + my.icon.infoitem,
          valid_children: ["metadata", "description"]
        },
        method: {
          icon: "odf-method " + my.icon.method,
          valid_children: ["metadata", "description"]
        },
        metadata: {
          icon: "odf-metadata " + my.icon.metadata,
          valid_children: []
        },
        description: {
          icon: "odf-description " + my.icon.description,
          valid_children: []
        }
      },
      checkbox: {
        three_state: false,
        keep_selected_style: true, // Consider false
        cascade: "up+undetermined",
        tie_selection: true
      },
      contextmenu: {
        show_at_node: true,
        items: openOdfContextmenu
      }
    };
    handleChange = (e, data) => {
      this.setState({
        selected: data.selected,
      });
    }
    render() {
      //const treeDiv = document.createElement('div');
      //treeDiv.jstree(this.odfTreeSettings);
      //return treeDiv;
      return <TreeView treeData={this.odfTreeSettings} onChange={this.handleChange} />
    }
