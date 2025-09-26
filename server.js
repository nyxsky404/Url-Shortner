const { nanoid } = require('nanoid');
const express = require('express');
const app = express();

app.use(express.json())

db = []

app.get('/', (req,res)=> {
    res.status(200).send('Welcome to Url Shortener')
})

app.get('/get-db', (req,res)=> {
    res.status(200).json(db)
})

app.post('/short', (req, res) => {

    if (!req.body.url){
        return res.status(400).json({
            message: "pls enter a url"
        })
    }

    long_url = req.body.url

    check_url = () => {
        if (db){
        for (let i of db){
            if (i.org_url == long_url){
            return i}}
        }
        return false
    }

    if (!check_url()){
        key = nanoid(6)
        short_url = `http://localhost:3000/${key}`

        ele = {
            id: key,
            org_url: long_url,
            shorter_url: short_url
        }

        db.push(ele)
        res.status(200).json(ele)
    }
    else{
        res.status(200).json(check_url())
    }
})


Port = 3000
app.listen(Port, ()=> {
    console.log(`Server started on port ${Port}`)
})