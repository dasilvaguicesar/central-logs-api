const { app } = require('../app');

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Listening at port 8080')
})