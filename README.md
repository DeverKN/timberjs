# TimberJS

## Examples

A basic counter
```html
    <div id="app">
        <div x-root x-scope="{ count: 0 }">
            <button @click="count--">-</button>
            Count is {{ count }}
            <button @click="count++">+</button>
        </div>
    </div>
```

Getting user input
```html
    <div id="app">
        <div x-root x-scope="{ name: 'James Garfield' }">
            <input x-model="name">
            Hello {{ name }}!
            <span x-hide="name !== 'Chuck Norris'">No Way!</span>
        </div>
    </div>
```

## Features

### Directives

#### Shorthands

@click="count++" is the same as x-on:click="count++"
\[class\]="count" = x-bind:class="count"
\$count = x-let:count

### Extending

### Compiler

## Differences from Alpine and Petite-Vue

## Alpine

## Petite-Vue
