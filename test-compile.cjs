const fs = require('fs');

const data = {
  blocks: {
    single: [
      { id: "1", type: "text", data: { text: "hello" } }
    ],
    left: [],
    right: []
  }
};

const compileModulesJSON = (data) => {
    return [
      {
        id: `mod-${data.id || "1"}`,
        designer_blocks: data.blocks,
      }
    ];
};

console.log(JSON.stringify(compileModulesJSON(data)));
