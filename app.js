const express = require('express')
const path = require('path')
const { studentSchema,links } = require('./models/student')
const cryptoRandomString = require('crypto-random-string')
const port = process.env.PORT || 3000;
const mysql = require('mysql');
const { async } = require('crypto-random-string');
const { log } = require('console');
const app = express()

app.use(express.json())
app.use(express.static('./public'))
app.use(express.static('./src'))
app.use(express.static('./attendance'))
app.use(express.static('./errors'))
app.use(express.urlencoded({extended:true}))

const link = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "Ware@2021",
	database: "links"
});

const mainDatabase = mysql.createConnection({
	host: "localhost",
	user : "root",
	password:"Ware@2021",
	database : "attendance"
})

app.get('/create',(req,res)=>{
	res.sendFile(path.join(__dirname,'/public/create.html'))
})

app.post('/create',async(req,res)=>{
	const { name ,title } = req.body

	const hashval = cryptoRandomString({length: 15,type:'alphanumeric'})
	var fullUrl = req.protocol + '://' + req.get('host') + '/attendance?db=' +  hashval;
	try {
		link.query(`INSERT INTO linktable (hashval,name,title) VALUES('${hashval}','${name}','${title}')`);
		res.send(`
		<style>
			div{
				padding-top:10%;
				text-align: center;
				color:blue;
			}
		</style>
		<div>
			<h1>Share this link for Attendance</h1>
			<a href=${fullUrl}>${fullUrl}</a>
		</div>
		`)
	} catch (error) {
		console.log(error);
	}
})



app.get('/attendance',async(req,res)=>{

	const{ db } = req.query
	if(!db)
	{
		return res.sendFile(path.join(__dirname,'errors/error.html'))
	}
	
	try{
		link.query(`SELECT hashval FROM linktable WHERE hashval = '${db}'`, async (error, results, fields) => {
			if (error) {
				console.error(error.message);
			}
			const str = JSON.stringify(results);
			const json = JSON.parse(str);
			if (json.length != 0) {
				return res.sendFile(path.join(__dirname, '/attendance/attendance.html'));
			}
			else {
				return res.sendFile(path.join(__dirname, 'errors/error.html'));
			}
		});
	}
	catch(e)
	{
		console.log(e)
	}
});

const  getTable = async(db) =>{
	return new Promise(async (resolve,reject)=>{
		var flag = 0;
		await mainDatabase.query(`SHOW TABLES LIKE '${db}'`, (error, results, fields) => {
			if (error) {
				console.error(error.message);
			}
			const str = JSON.stringify(results);
			const json = JSON.parse(str);
			if (json.length != 0) {
				flag = 1;
			}
			resolve({flag:flag});
		})
	})
}
const createTable = async (db) =>{
	return new Promise(async (resolve,reject)=>{
		const sql = `CREATE TABLE ${db}(name varchar(255),prn varchar(255) UNIQUE)`;
	
		const result = await mainDatabase.query(sql)
		resolve({result:result})
	})
}

app.post('/attendance', async(req,res)=>{

	const{ db }= req.query
	if(!db)
	{
		return res.sendFile(path.join(__dirname,'errors/error.html'))
	}
	const {name ,prn} = req.body
	try{
		
		const { flag } = await getTable(db);
		if(flag == 0){
			const{ result } = await createTable(db);
		}

		await mainDatabase.query(`INSERT INTO ${db} VALUES('${name}','${prn}')`,(error,results,fields)=>{
			if(error)
			{
				return res.send('<script>alert(`ERROR!!\nSeems like attendennce is already recorded or you entered invalid information.\nPlease Try Again!!` ); window.location.assign(window.location.href)</script>')
			}
			else
			{
				return res.send('<script>alert("Recorded"); window.location.assign(window.location.href)</script>')
			}
		})
	}
	catch(e)
	{
		res.send('<script>alert(`ERROR!!\nSeems like attendennce is already recorded or you entered invalid information.\nPlease Try Again!!` ); window.location.assign(window.location.href)</script>')

	}
})

app.get('/get/:db',async(req,res)=>{
	const { db } = req.params
	if(!db)
	{

		return res.sendFile(path.join(__dirname,'errors/error.html'))
	}

	await mainDatabase.query(`SELECT prn FROM ${db}`,(error,results,fields)=>{
		res.send(results)
	})


})

app.get('/getlist',(req,res)=>{
	res.sendFile(path.join(__dirname,'/attendance/responselist.html'))
})

app.get('/getinfo/:db',async(req,res)=>{

	const { db } = req.params
	await link.query(`SELECT title,name from linktable WHERE hashval = '${db}'`,(error,result,fields)=>{
		res.send(result)
	})
})

app.listen(port,()=>{
	console.log(`Connected at port ${port}`)
})