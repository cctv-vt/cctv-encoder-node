const { readFileSync, writeFile, existsSync } = require('fs')

export class Queue {
    constructor( options ) {
        this.q = []
        this.file = options.file
        if (options.file) {
            if ( existsSync(options.file) ) {
                this.q = JSON.parse(readFileSync(options.file))
                this.updateFile()
            } else {
                writeFile(this.file, JSON.stringify([]), err => {
                    if (err) logger.error(err)
                })
            }
        }
    }
    add( item ) {
        this.q.push(item)
        this.updateFile()
    }
    recieve() {
        current = this.q.shift()
        this.updateFile()
        return current
    }
    print() { return this.q }
    updateFile() {
        if (this.file) {
            writeFile(this.file, JSON.stringify(this.q), err => {
                if (err) logger.error(err)
            })
        }
    }
}