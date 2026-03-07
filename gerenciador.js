const config     = require('./config.json');
const prompt     = require('prompt-sync')();
const fs         = require('fs');
const { modo_prod, modo_dev } = config;


const gerenciador = {
    init(){
        this.createSyncSelectors();
    },
    createSyncSelectors(){
        const seletores = `
        Please select the sync direction:
        1. dev to prod
        2. prod to dev
        `
        const selectedOption = prompt(seletores);
        if (selectedOption === '1') {
            this.syncDevToProd();
        } else if (selectedOption === '2') {
            this.syncProdToDev();
        } else {
            console.error('Invalid option selected.');
        }
    },
    syncDevToProd() {
        this.sync('dev');
    },
    syncProdToDev() {
        this.sync('prod');
    },
    async sync(mode){
        
       const sourceDir = mode === 'dev' ? modo_dev.dir : modo_prod.dir;
       const destDir = mode === 'dev' ? modo_prod.dir : modo_dev.dir;

        console.log(`Syncing from ${sourceDir} to ${destDir}`);

        fs.readdir(sourceDir, (err, files) => {
            if (err) {
                console.error(`Error reading source directory (${sourceDir}):`, err);
                return;
            }

            files.forEach(file => {

                const srcPath = `${sourceDir}/${file}`;
                const destPath = `${destDir}/${file}`;
                
                // escape if srcPath is the gs directory
                if (srcPath.includes('gs')) {
                    return;
                }

                fs.copyFile(srcPath, destPath, (copyErr) => {
                    if (copyErr) {
                        console.error(`Error copying ${file} from ${sourceDir} to ${destDir}:`, copyErr);
                    } else {
                        console.log(`Copied ${file} from ${sourceDir} to ${destDir}.`);
                    }
                });
            });
        })

        // please wait a few seconds before redefining the index file
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.redefineIndexFile(mode);
    },
    redefineIndexFile(mode) {
        /** 
         * considering the given mode,
         * get the index.html file from the mode.dir
         * then get the line where const baseurl is set
         * and update it with the correct mode.webhook
         **/
        const dir = mode === 'prod' ? modo_dev.dir : modo_prod.dir;
        const indexFilePath = `${dir}/index.html`;

        fs.readFile(indexFilePath, 'utf8', (err, data) => {
            
            if (err) {
                console.error(`Error reading index file (${indexFilePath}):`, err);
                return;
            }

            const baseUrlLine = `const baseurl = "${mode === 'prod' ? modo_dev.webhook : modo_prod.webhook}";`;
            const updatedData = data.replace(/const baseurl = ".*";/, baseUrlLine);

            fs.writeFile(indexFilePath, updatedData, 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error(`Error writing to index file (${indexFilePath}):`, writeErr);
                } else {
                    console.log(`Updated index file (${indexFilePath}) with baseurl: ${baseUrlLine}`);
                }
            });
        });

    }
}

gerenciador.init();