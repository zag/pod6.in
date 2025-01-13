// podlite, copyright (c) by Aliaksandr Zahatski
// Distributed under an MIT license: https://github.com/podlite/podlite/blob/main/LICENSE


import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import '../node_modules/codemirror/theme/duotone-dark.css';
 
function ifBeginAbbrBlock (ifOk) {
    const res = [
    { regex: /\s*(=)(?=head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include)/,
      token: "keyword",
      sol: true,
      push: ifOk,
      // next:ifOk
    },
    ];
  return res
  }
  
  
  
  function getBlockNames () {
      const names = ['code', 'comment', 'data', 'defn', 'formula', 'input', 'markdown', 'nested', 'output', 'para', 'picture', 'pod', 'table', 'toc', 'include']
      names.push(...[...Array(10)].map((_, i) => `head${i + 1}`));
      names.push(...[...Array(10)].map((_, i) => `item${i + 1}`).reverse());
      names.push('item', 'head');
      return names;
  }
  
  function getContentState (token = 'content') {
       return [
          { regex: /(?=\s*=\w+)/,
          token: "content",
          sol: true,
          pop: true,
        },
        // { regex: /\s*$/,
        //   token: "content1",
        //   sol: true,
        //   pop: true,
        // },
  
        { regex: /(B<)([^>]*)(>)/,
          token: ["keyword", `strong ${token}`, "keyword"],
        },
        { regex: /(I<)([^>]*)(>)/,
          token: ["keyword", `em ${token}`, "keyword"],
        },
        { regex: /(S<)([^>]*)(>)/,
          token: ["keyword", `strikethrough ${token}`, "keyword"],
        },
        { regex: /./,
          token: token,
        },
      ]
  }
  function getDefaultContentState (token = 'content') {
    return [
      
     { regex: /(B<)([^>]*)(>)/,
       token: ["keyword", `strong ${token}`, "keyword"],
     },
     { regex: /(I<)([^>]*)(>)/,
       token: ["keyword", `em ${token}`, "keyword"],
     },
     { regex: /(S<)([^>]*)(>)/,
       token: ["keyword", `strikethrough ${token}`, "keyword"],
     },
     { regex: /./,
       token: token,
     },
   ]
  }
  
  function getStatesForBlock (blockName, contentToken) {
  return {
    [`${blockName}_content_Abbr`]: [
      // it's not possible to detect empty lines :https://discuss.codemirror.net/t/detect-blank-lines-with-simple-mode/2167/3
      {
          regex: /^\s*$/,
          token: null,
          sol: true,
          pop: true,
       
      },
      ...getContentState(contentToken)
    ],
    [`${blockName}_attr_Para`]: [
      ...ifNextBeginDelimBlock({pop: true}),
      ...ifNextBeginAbbrBlock({pop: true}),
      ...ifNextBeginParaBlock({pop: true}),
      ...ifEndOfAttributes({next: `${blockName}_content_Para`}),
      ...attributesContent(),
    ],
   [`${blockName}_content_Para`]: [
        // it's not possible to detect empty lines :https://discuss.codemirror.net/t/detect-blank-lines-with-simple-mode/2167/3
        {
          regex: /^\s*$/,
          token: null,
          sol: true,
          pop: true,
       
      },
    ...getContentState(contentToken),
   ],
  
   [`${blockName}_attr_Delim`]: [
    
    ...ifNextBeginDelimBlock({pop: true}),
    ...ifNextBeginAbbrBlock({pop: true}),
    ...ifNextBeginParaBlock({pop: true}),
    ...ifEndOfAttributes({next: `${blockName}_content_Delim`}),
    ...attributesContent(),
  ],
  [`${blockName}_content_Delim`]: [
    ...ifBeginParaBlock('beginParaBlock'),
    ...ifBeginAbbrBlock('beginAbbrBlock'),
    ...ifBeginDelimBlock('beginDelimBlock'),
    ...ifNextEndDelimBlock({next: 'endDelimBlock'}),
    ...getDefaultContentState(contentToken),
     {
      regex: /.*/,
      token: `content`,
  },
  ]
  }
  }
  function getContentStates () {
      const names = getBlockNames();
      const getStateForBlock = (blockName) => {
          const matchRes = blockName.match(/(?<blockname>[^\d]+)(?<level>\d*)/) 
          const level = matchRes?.groups?.level || 1;
          const blName = matchRes?.groups?.blockname || blockName;
          if (blName === 'head') {
            return getStatesForBlock(blockName, `header header-${level}`)
          }
          
          return getStatesForBlock(blockName)
      }
      return names.reduce((acc, name) => {
        return {...acc, ...getStateForBlock(name)}
      }, {})
  }
  
  function ifBlockName (ifOk='content', attr={}) {
    const names = getBlockNames();
  
    if (ifOk==='Para') {
      return names.map(name => {
        return { 
          regex: new RegExp(`(${name})\\s*`),
          token: `variable-2 ${name}`,
          next: `${name}_attr_Para`,
        }})
    }
    if (ifOk==='Abbr') {
      return names.map(name => {
        return { 
          regex: new RegExp(`(${name})\\s*`),
          token: `variable-2 ${name}`,
          next: `${name}_content_Abbr`,
        }})
    }
    if (ifOk==='Delim') {
      return names.map(name => {
        return { 
          regex: new RegExp(`(${name})\\s*`),
          token: `variable-2 ${name}`,
          next: `${name}_attr_Delim`,
        }})
    }
    return names.map(name => {
        return { 
          regex: new RegExp(`${name}\\s*`),
          token: `variable-2 ${name}`,
          next: ifOk,
          ...attr
        }}
      );
    
  }
  function ifNextBeginDelimBlock (attr= {} ) {
    return [{ 
      regex: /(?=\s*=begin\s*(?:head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include|\w+))/,
      token: null,
      sol: true,
      ...attr
    }]
  }
  
  function ifNextEndDelimBlock (attr= {} ) {
    return [{ 
      regex: /(?=\s*=end\s*(?:head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include|\w+))/,
      token: null,
      sol: true,
      ...attr
    }]
  }
  
  function ifNextBeginAbbrBlock (attr= {} ) {
    return [{
      regex: /(?=\s*=(?:head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include))/,
      token: null,
      sol: true,
      ...attr
    }];
  }
  
  function ifNextBeginParaBlock (attr= {} ) {
    return [
    { regex: /(?=\s*=for\s*(?=head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include|\w+))/,
      token: "keyword",
      sol: true,
      ...attr
    }]
  }
  
  function attributesContent (attr= {} ) {
    return[
      { regex: /(\s*)(=)(\s*)/,
      token: [null,'keyword',null],
      sol: true,
    },
    { regex: /:\w+/,
      token: 'attribute',
    },
    { regex: /[<(].*?[>)]/,
      token: 'string',
    }]
  }
  
  function ifEndOfAttributes (attr= {} ) {
    return [{
      regex: /(?!\s*=\s+)/,
      token: null,
      sol: true,
      ...attr
    }]
  }
  
  function ifBeginDelimBlock (ifOk ) {
    return [{ 
      regex: /\s*(=begin)\s*(?=head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include|\w+)/,
      token: "keyword",
      sol: true,
      push: ifOk,
    }]
  }
  
  function ifBeginParaBlock (ifOk ) {
    return [{ 
      regex: /\s*(=for)\s*(?=head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include|\w+)/,
      token: "keyword",
      sol: true,
      push: ifOk,
    }]
  }
  
    CodeMirror.defineSimpleMode("podlite", {
      start: [
        ...ifBeginParaBlock('beginParaBlock'),
        ...ifBeginAbbrBlock('beginAbbrBlock'),
        ...ifBeginDelimBlock('beginDelimBlock'),
  
        { regex: /.*$/,
          token: 'error',
        },
  
      ],
      beginDelimBlock: [
         ...ifBlockName('Delim'),
        { 
          regex: /(\w+)(\s*)/,
          token: [`variable-3`,null],
          next: 'attributes_delim',
        },
      ],
      attributes_delim: [
        ...ifNextEndDelimBlock({next: 'endDelimBlock'}),
        ...ifEndOfAttributes({next: 'contentDelimBlock'}),
        ...attributesContent(),
      ],
      contentDelimBlock: [
        ...ifBeginParaBlock('beginParaBlock'),
        ...ifBeginAbbrBlock('beginAbbrBlock'),
        ...ifBeginDelimBlock('beginDelimBlock'),
        ...ifNextEndDelimBlock({next: 'endDelimBlock'}),
        ...getDefaultContentState(),
         {
          regex: /.*/,
          token: `content`,
      },
      ],
      endDelimBlock: [
       { regex: /(\s*)(=end)(\s*)(head\d*|item\d*|code|comment|data|defn|formula|input|markdown|nested|output|para|picture|pod|table|toc|include)/,
          token: [null,"keyword", null, "variable-2"],
          sol: true,
          pop: true,
        },
        { regex: /(\s*)(=end)(\s*)(\w+)/,
          token: [null,"keyword", null,"variable-3"],
          sol: true,
          pop: true,
        },
      ],
  
      beginParaBlock: [
        ...ifBlockName('Para'),
        { 
          regex: /(\w+)(\s*)/,
          token: ['variable-3',null],
          next: 'attributes',
        }
      ],
  
      attributes: [
        ...ifNextBeginDelimBlock({pop: true}),
        ...ifNextBeginAbbrBlock({pop: true}),
        ...ifNextBeginParaBlock({pop: true}),
        ...ifEndOfAttributes({next: 'content'}),
        ...attributesContent(),
      ],
      beginAbbrBlock: [
        ...ifBlockName('Abbr'),
      ],
      content: [
          ...getContentState()
      ],
      ...getContentStates()
  
    })
    CodeMirror.registerHelper("wordChars", "perl", /[\w$]/);
  
    CodeMirror.defineMIME("text/podlite", "podlite");
  