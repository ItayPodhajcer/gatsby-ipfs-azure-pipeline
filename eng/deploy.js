const fs = require("fs")
const path = require("path")
const ipfsClient = require('ipfs-http-client')

const getAllFiles = function (dirPath, originalPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []
    originalPath = originalPath || path.resolve(dirPath, "..")

    folder = path.relative(originalPath, path.join(dirPath, "/"))

    arrayOfFiles.push({
        path: folder.replace(/\\/g, "/"),
        mtime: fs.statSync(folder).mtime
    })

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, originalPath, arrayOfFiles)
        } else {
            file = path.join(dirPath, "/", file)

            arrayOfFiles.push({
                path: path.relative(originalPath, file).replace(/\\/g, "/"),
                content: fs.readFileSync(file),
                mtime: fs.statSync(file).mtime
            })
        }
    })

    return arrayOfFiles
}

if (process.argv.length != 4) {
    console.error('Missing path and/or url arguments, terminating!')
}
else {
    const files = getAllFiles(process.argv[2])
    const ipfs = ipfsClient(process.argv[3])
    const rootFolder = "/" + path.relative(path.resolve(process.argv[2], ".."), process.argv[2])

    ipfs.add(files, { pin: true,  })
        .then(result => {
            const rootItem = "/ipfs/" + result[result.length - 1].hash
            console.info(result)
            console.info("Copying from " + rootItem + " to " + rootFolder)
            ipfs.files.cp(rootItem, rootFolder)
        })
        .catch(error => console.error(error))
}