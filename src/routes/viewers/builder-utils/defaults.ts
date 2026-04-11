import { ViewerBlock } from "@src/context/ViewerContext";

// Import templates as raw strings
import textCode from "./templates/text.js?raw";
import jsonCode from "./templates/json.js?raw";
import headersCode from "./templates/headers.js?raw";
import tableCode from "./templates/table.js?raw";
import htmlCode from "./templates/html.js?raw";
import defaultCode from "./templates/default.js?raw";

import layoutHtml from "./templates/layout.html?raw";
import layoutCss from "./templates/layout.css?raw";

export const getDefaultCode = (type: ViewerBlock['type']) => {
  switch (type) {
    case 'text': return textCode;
    case 'json': return jsonCode;
    case 'headers': return headersCode;
    case 'table': return tableCode;
    case 'html': return htmlCode;
    default: return defaultCode;
  }
};

export const getDefaultHtml = () => {
  return layoutHtml.trim();
};

export const getDefaultCss = () => {
  return layoutCss.trim();
};
