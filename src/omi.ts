//import JSDOM from 'jsdom';

let WebOmi = { debug: console.log };

export let parseXml = function(response: string | Document) {
  var xmlTree;
  if (typeof response !== 'string') {
    return response;
  }
  const responseString = response as string;
  if (responseString.length < 2) {
    return null;
  }
  try {
    xmlTree = new DOMParser().parseFromString(responseString, 'application/xml');
  } catch (error) {
    // parsererror or FIXME: unsupported?
    xmlTree = null;
    WebOmi.debug('DOMParser xml parsererror or not supported!', error);
  }

  // mozilla parsererror
  if (!xmlTree || (xmlTree.firstElementChild && xmlTree.firstElementChild.nodeName === 'parsererror')) {
    WebOmi.debug('PARSE ERROR:');
    WebOmi.debug('in:', responseString);
    WebOmi.debug('out:', xmlTree);
    xmlTree = null;
  }
  return xmlTree;
};
// XML Namespace URIs used in the client
// (needed because of the use of default namespaces with XPaths)
interface NSInterface {
  omi: string;
  odf: string;
  omi2: string;
  odf2: string;
  [key: string]: string;
}
export let ns: NSInterface = {
  omi: 'http://www.opengroup.org/xsd/omi/1.0/',
  odf: 'http://www.opengroup.org/xsd/odf/1.0/',
  omi2: 'http://www.opengroup.org/xsd/omi/2.0/',
  odf2: 'http://www.opengroup.org/xsd/odf/2.0/',
};
//  xsi : "http://www.w3.org/2001/XMLSchema-instance"
//  xs  : "http://www.w3.org/......."

// XML Namespace resolver, (defaults to odf)
export let nsResolver = function(name: string | null): string {
  return (name ? ns[name] : null) || ns.odf;
};

// Generic Xpath evaluator
// elem: used as root for relative queries
// xpath: xpath as string
export let evaluateXPath = function(elem: Node | Document, xpath: string) {
  var iter, res, results, xpe;
  xpe = elem.ownerDocument || (elem as Document);
  iter = xpe.evaluate(xpath, elem, nsResolver, 0, null);
  results = [];
  res = iter.iterateNext();
  while (res) {
    results.push(res);
    res = iter.iterateNext();
  }
  return results;
};

export let getObjectChildren = function(xmlNode: Element) {
  return evaluateXPath(xmlNode, './odf:InfoItem | ./odf:Object');
};

export let createOdfDocument = () => document.implementation.createDocument(ns.odf, 'Objects', null);

export let createOdf = function(elem: string, doc: Document) {
  return doc.createElementNS(ns.odf, elem);
};
export let createOmi = function(elem: string, doc: Document) {
  return doc.createElementNS(ns.omi, elem);
};
export let createOdfObject = function(doc: Document, id: string) {
  const createdElem = createOdf('Object', doc);
  const idElem = createOdf('id', doc);
  const textElem = doc.createTextNode(id);
  idElem.appendChild(textElem);
  createdElem.appendChild(idElem);
  return createdElem;
};

//interface SimpleOdfValue {
//  value: string;
//  valuetime: string; // unix time
//  valuetype: string;
//}

// Create omi element with the right namespace
// values have structure [{ value:String, valuetime:String unix-time, valuetype:String }]
//export let createOdfInfoItem = function(doc: Document, name: string, values = [], description = null) {
export let createOdfInfoItem = function(doc: Document, name: string) {
  let createdElem = createOdf('InfoItem', doc);
  createdElem.setAttribute('name', name);
  //for (let i = 0, len = values.length; i < len; i++) {
  //  const value = values[i];
  //  const val = createOdfValue(doc, value.value, value.type, value.time);
  //  createdElem.appendChild(val);
  //}
  //if (description != null) {
  //  // prepend as first
  //  createdElem.insertBefore(createOdfDescription(doc, description), createdElem.firstChild);
  //}
  return createdElem;
};

// Gets the id of xmlNode Object or name of InfoItem
// xmlNode: XmlNode
// return: Maybe String
export let getOdfId = function(xmlNode: Element) {
  var head, nameAttr;
  switch (xmlNode.nodeName) {
    case 'Object':
      head = evaluateXPath(xmlNode, './odf:id')[0];
      if (head != null) {
        return head.textContent?.trim();
      } else {
        return null;
      }
      break;
    case 'InfoItem':
      nameAttr = xmlNode.attributes.getNamedItem('name'); //.name;
      if (nameAttr != null) {
        return nameAttr.value;
      } else {
        return null;
      }
      break;
    case 'Objects':
      return 'Objects';
    case 'MetaData':
      return 'MetaData';
    case 'description':
      return 'description';
    default:
      return null;
  }
};

export let elemOdfPath = function(xmlElem: Element | null, childPath: null | string = null): string {
  if (xmlElem === null || xmlElem.nodeName === 'Objects') {
    return childPath || '';
  }
  const thisId = getOdfId(xmlElem);
  const parent = xmlElem.parentElement; // parentNode
  const path = thisId + (childPath ? '/' + childPath : '');
  return elemOdfPath(parent, path);
};
