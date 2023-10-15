const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/convert', async (req, res) => {
    try {
        const { markdown } = req.body;
        const uploadedFile = req.files ? req.files.mdFile : null;

        if (!markdown && !uploadedFile) {
            return res.status(400).send('No Markdown content provided.');
        }

        let tempFilePath = null;
        if (uploadedFile) {
            tempFilePath = './markdown/temp.md';
            await uploadedFile.mv(tempFilePath);
        }

        const pdfFile = './markdown/output.pdf';
        const inputPath = uploadedFile ? tempFilePath : '-';
        const pandocCommand = `pandoc ${inputPath} -o ${pdfFile} --pdf-engine=wkhtmltopdf`;

        exec(pandocCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Pandoc error:', error);
                console.error('Pandoc stderr:', stderr);
                return res.status(500).send('Conversion failed: ' + stderr);
            }
            res.render('result');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/download', (req, res) => {
    const pdfFile = './markdown/output.pdf';
    res.download(pdfFile, 'output.pdf');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
