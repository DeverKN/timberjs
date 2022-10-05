type Todo = {
    text: string,
    complete: boolean
}
let todos: Todo[] = [{text: 'win case comp', complete: false}, {text: 'make cool slides', complete: false}]
let newTodo: string = ''
const removeToDo = (index: number) => {
    todos = todos.filter((_, i) => i !== index)
}
const addToDo = () => {
    todos = [...todos, {text: newTodo, complete: false}]
    newTodo = ''
}