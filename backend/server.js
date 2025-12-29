const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const { nanoid } = require('nanoid');
const QRCode = require('qrcode');

const express = require('express');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const cors = require('cors');

require('dotenv').config();
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

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

app.get('/qr/:key', async (req, res) => {
    const url_key = req.params.key;
    const format = req.query.format || 'png';
    const download = req.query.download === 'true';

    const urlData = await prisma.url_data.findUnique({
        where: { url_id: url_key },
        select: { shorter_url: true }
    });

    if (!urlData) {
        return res.status(404).json({ message: 'URL not found' });
    }

    try {
        if (format === 'svg') {
            const qrSvg = await QRCode.toString(urlData.shorter_url, { type: 'svg' });
            res.setHeader('Content-Type', 'image/svg+xml');
            if (download) {
                res.setHeader('Content-Disposition', `attachment; filename="qr-${url_key}.svg"`);
            } else {
                res.setHeader('Content-Disposition', `inline; filename="qr-${url_key}.svg"`);
            }
            res.send(qrSvg);
        } else if (format === 'png' || format === 'jpeg' || format === 'jpg') {
            const qrBuffer = await QRCode.toBuffer(urlData.shorter_url, {
                type: 'png',
                width: 500,
                margin: 2
            });
            const contentType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
            const extension = format === 'jpeg' || format === 'jpg' ? 'jpg' : 'png';
            res.setHeader('Content-Type', contentType);
            if (download) {
                res.setHeader('Content-Disposition', `attachment; filename="qr-${url_key}.${extension}"`);
            } else {
                res.setHeader('Content-Disposition', `inline; filename="qr-${url_key}.${extension}"`);
            }
            res.send(qrBuffer);
        } else {
            res.status(400).json({ message: 'Invalid format. Use png, jpeg, or svg' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error generating QR code', error: error.message });
    }
})

app.post('/short', async(req, res) => {

    if (!req.body || !req.body.url){
        return res.status(400).json({
            message: "Please enter a URL"
        })
    }

    const long_url = req.body.url
    const customAlias = req.body.customAlias

    if (customAlias) {
        const aliasRegex = /^[a-zA-Z0-9_-]{3,20}$/
        if (!aliasRegex.test(customAlias)) {
            return res.status(400).json({
                message: "Custom alias must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores"
            })
        }

        const aliasExists = await prisma.url_data.findUnique({
            where: { url_id: customAlias }
        })

        if (aliasExists) {
            return res.status(409).json({
                message: "This custom alias is already taken. Please choose another one."
            })
        }
    }

    const check_url = await prisma.url_data.findFirst({
            where: {
            org_url:  long_url
            },
            select:{
                url_id: true,
                shorter_url: true,
                created_at: true
            }
        })

    if (!check_url){
        const key = customAlias || nanoid(6)
        const short_url = `${SERVER_URL}/${key}`

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
        
        const response = {
            ...create_data,
            qr_code: {
                png: `${SERVER_URL}/qr/${key}?format=png`,
                jpeg: `${SERVER_URL}/qr/${key}?format=jpeg`,
                svg: `${SERVER_URL}/qr/${key}?format=svg`
            }
        }
        
        res.status(200).json(response)
    }
    else{
        const response = {
            ...check_url,
            qr_code: {
                png: `${SERVER_URL}/qr/${check_url.url_id}?format=png`,
                jpeg: `${SERVER_URL}/qr/${check_url.url_id}?format=jpeg`,
                svg: `${SERVER_URL}/qr/${check_url.url_id}?format=svg`
            }
        }
        res.status(200).json(response)
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