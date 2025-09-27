const { PrismaClient } = require('./generated/prisma')
const prisma = new PrismaClient()

const { nanoid } = require('nanoid');

const express = require('express');
const app = express();

app.use(express.json())

// Home Page
app.get('/', (req,res)=> {
    res.status(200).send('Welcome to Url Shortener')
})


// Get all Data
app.get('/get-db', async (req,res)=> {

    const get_data = await prisma.url_data.findMany({
        select:{
            url_id: true,
            org_url: true,
            shorter_url: true
        }
    })

    res.status(200).json(get_data)
})



// Create Shorter url
app.post('/short', async(req, res) => {

    if (!req.body.url){
        return res.status(400).json({
            message: "pls enter a url"
        })
    }

    const long_url = req.body.url

    // find url if exists
    const check_url = await prisma.url_data.findFirst({
            where: {
            org_url:  long_url
            },
            select:{
                org_url: true
            }
        })


    if (!check_url){
        const key = nanoid(6)
        const short_url = `http://localhost:3000/${key}`

        // create data
        const create_data = await prisma.url_data.create({
                data: {
                    url_id: key,
                    org_url: long_url,
                    shorter_url: short_url
                },
                        select:{
            url_id: true,
            org_url: true,
            shorter_url: true
        }
            })
        res.status(201).location(long_url)
    }
    else{
        // res.status(200).json(check_url)
        res.redirect(302, check_url.org_url)
    }
})


app.delete('/delete/:key', async(req,res)=> {
    const delete_key = req.params.key

    // find url if exists
    const check_url = await prisma.url_data.findFirst({
            where: {
            url_id:  delete_key
            }
        })
    
    if (!check_url){
        return res.status(404).json({
            msg: "No record found"
        })
    }

    const delete_url = await prisma.url_data.delete({
        where: {
            url_id: delete_key
        }
    })

    res.status(200).json({
        msg: "Successfully deleted",
        data: delete_url
    })
})



// Server listen
const PORT = 3000
app.listen(PORT, ()=> {
    console.log(`Server started on port ${PORT}`)
})