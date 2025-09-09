const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
    console.log('server running: http://localhost:${PORT}');
});