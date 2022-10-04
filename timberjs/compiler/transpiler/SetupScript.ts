import { transform } from "@babel/core";

const scriptSetupPlugin = (babel) => {
    const { types: t } = babel;
    
    const scoped = new Set()
    return {
      name: "ast-transform", // not required
      visitor: {
        ExportNamedDeclaration(path) {
          const { node } = path
          const { kind, declarations } = node.declaration
          path.replaceWithMultiple(declarations.map((declarator) => {
            const { name } = declarator.id
            scoped.add(name)
            return t.callExpression(
                    t.identifier("$$declare"),
                    [
                      t.stringLiteral(kind),
                      t.stringLiteral(name),
                      declarator.init || t.identifier("$$empty")
                    ]
             )
          }))
          
          //path.node.name = path.node.name.split('').reverse().join('');
        },
        Identifier(path) {
          const {node} = path
          const {name} = node
          if (scoped.has(name)) {
            const parent = path.parentPath.node
            const isMemberExp = (parent.type === "MemberExpression" && parent.property === node)
            const isObjectProp = parent.type === "ObjectProperty" && parent.key === node && parent.computed === false
            if (!isObjectProp) {
              path.replaceWith(t.memberExpression(
                t.identifier("$$scoped"),
                node
              ))
              path.skip()
            }
          }/* else {
            const parent = path.parentPath.node
            const isMemberExp = (parent.type === "MemberExpression" && parent.property === node)
            const isObjectProp = (parent.type === "ObjectProperty" && parent.key === node) 
            if (!(isObjectProp || isMemberExp)) {
              path.replaceWith(t.memberExpression(
                t.identifier("$$maybeScoped"),
                node
              ))
            }
            path.skip()
          }*/
        }
      }
    };
  }

  export const transpileSetupScript = (source: string, lang: string) => {
    // console.log({lang, source})
    const compiled = transform(source, 
      {
          plugins:[
                    scriptSetupPlugin,
                    "@babel/plugin-transform-typescript"
                  ],
          filename: 'inline.js'
      }
    );
    return compiled.code
  }
  