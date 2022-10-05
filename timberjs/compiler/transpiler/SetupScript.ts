import { transform } from "@babel/core";

const makeScriptSetupPlugin = (props: string[]) => {
  return (babel) => {
    const { types: t } = babel;
    
    const scoped = new Set(props)
    return {
      name: "ast-transform", // not required
      visitor: {
        VariableDeclaration(path) {
          const { node } = path
          const { kind, declarations } = node
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
        },
        // ExportNamedDeclaration(path) {
        //   const { node } = path
        //   const { kind, declarations } = node.declaration
        //   path.replaceWithMultiple(declarations.map((declarator) => {
        //     const { name } = declarator.id
        //     scoped.add(name)
        //     return t.callExpression(
        //             t.identifier("$$declare"),
        //             [
        //               t.stringLiteral(kind),
        //               t.stringLiteral(name),
        //               declarator.init || t.identifier("$$empty")
        //             ]
        //      )
        //   }))
          
        // },
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
}

  export const transpileSetupScript = (source: string, lang: string, props: string[] = []) => {
    const compiled = transform(source, 
      {
          plugins:[
                    makeScriptSetupPlugin(props),
                    "@babel/plugin-transform-typescript"
                  ],
          filename: 'inline.js'
      }
    );
    return compiled.code
  }
  