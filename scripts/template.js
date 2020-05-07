module.exports = (data, name) => Promise.resolve(
`
import * as React from "react";

function ${name}(props) {
  return /*#__PURE__*/React.createElement("img", Object.assign({
    alt: ""
  }, props, {
    src: "data:image/png;base64,${data.toString('base64')}"
  }));
}

export default ${name};
`
)
