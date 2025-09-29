const { PrismaClient } = require('./generated/prisma')
const prisma = new PrismaClient()

const { nanoid } = require('nanoid');

const express = require('express');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

function parseUserAgent(userAgentString) {
    const parser = new UAParser(userAgentString);
    const result = parser.getResult();
    
    return {
        browser: result.browser.name || 'Unknown',
        os: result.os.name || 'Unknown',
        device_type: result.device.type || 'Unknown'
    };
}

function getGeoData(ip) {
    const cleanIp = ip.replace('::ffff:', '');
    
    if (cleanIp === '127.0.0.1' || cleanIp === '::1') {
        return { country: 'Local', city: 'Localhost' };
    }
    
    const geo = geoip.lookup(cleanIp);
    return {
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown'
    };
}

app.get('/', (req,res)=> {
    res.status(200).send('Welcome to Url Shortener')
})

app.get('/get-db', async (req,res)=> {

    const get_data = await prisma.url_data.findMany({
        select:{
            url_id: true,
            org_url: true,
            shorter_url: true,
            created_at: true,
            _count: {
                select: { clicks: true }
            }
        }
    })

    res.status(200).json(get_data)
})

app.get('/analytics/:key', async (req, res) => {
    const url_key = req.params.key;

    const urlData = await prisma.url_data.findUnique({
        where: { url_id: url_key },
        include: {
            clicks: {
                orderBy: { clicked_at: 'desc' }
            }
        }
    });

    if (!urlData) {
        return res.status(404).json({ message: 'URL not found' });
    }

    const totalClicks = urlData.clicks.length;
    
    const clicksByCountry = urlData.clicks.reduce((acc, click) => {
        acc[click.country] = (acc[click.country] || 0) + 1;
        return acc;
    }, {});

    const clicksByDevice = urlData.clicks.reduce((acc, click) => {
        acc[click.device_type] = (acc[click.device_type] || 0) + 1;
        return acc;
    }, {});

    const clicksByBrowser = urlData.clicks.reduce((acc, click) => {
        acc[click.browser] = (acc[click.browser] || 0) + 1;
        return acc;
    }, {});

    const clicksByDay = urlData.clicks.reduce((acc, click) => {
        const date = click.clicked_at.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const referrers = urlData.clicks
        .filter(click => click.referrer && click.referrer !== 'Direct')
        .reduce((acc, click) => {
            acc[click.referrer] = (acc[click.referrer] || 0) + 1;
            return acc;
        }, {});

    res.status(200).json({
        url_id: urlData.url_id,
        org_url: urlData.org_url,
        shorter_url: urlData.shorter_url,
        created_at: urlData.created_at,
        analytics: {
            totalClicks,
            clicksByCountry,
            clicksByDevice,
            clicksByBrowser,
            clicksByDay,
            topReferrers: referrers,
            recentClicks: urlData.clicks.slice(0, 10)
        }
    });
})

app.post('/short', async(req, res) => {

    if (!req.body || !req.body.url){
        return res.status(400).json({
            message: "Please enter a URL"
        })
    }

    const long_url = req.body.url

    const check_url = await prisma.url_data.findFirst({
            where: {
            org_url:  long_url
            },
            select:{
                shorter_url: true
            }
        })


    if (!check_url){
        const key = nanoid(6)
        const short_url = `http://localhost:3000/${key}`

        const create_data = await prisma.url_data.create({
                data: {
                    url_id: key,
                    org_url: long_url,
                    shorter_url: short_url
                },
                select:{
                    url_id: true,
                    org_url: true,
                    shorter_url: true,
                    created_at: true
                }
            })
        res.status(200).json(create_data)
    }
    else{
        res.status(200).json(check_url)
    }
})

app.get('/:key', async (req, res) => {
    const url_key = req.params.key;

    const urlData = await prisma.url_data.findUnique({
        where: { url_id: url_key }
    });

    if (!urlData) {
        return res.status(404).json({ message: 'URL not found' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    
    const { browser, os, device_type } = parseUserAgent(userAgent);
    const { country, city } = getGeoData(ip);

    await prisma.click.create({
        data: {
            url_id: url_key,
            ip_address: ip,
            country,
            city,
            user_agent: userAgent,
            browser,
            os,
            device_type,
            referrer
        }
    });

    res.redirect(302, urlData.org_url);
});



app.delete('/delete/:key', async(req,res)=> {
    const delete_key = req.params.key

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

const PORT = 3000
app.listen(PORT, ()=> {
    console.log(`Server started on port ${PORT}`)
})