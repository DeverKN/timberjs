interface Comment {
    text: string,
    complete: boolean
}
export let todos: Comment[] = [{text: 'win case comp', complete: false}, {text: 'make cool slides', complete: false}]
export let newTodo: string = ''
export const removeToDo = (index: number) => {
    todos = todos.filter((_, i) => i !== index)
}
export const addToDo = () => {
    todos = [...todos, {text: newTodo, complete: false}]
    newTodo = ''
}