var express  = require('express'),
path = require('path'),
bodyParser= require('body-parser'),
cons = require('consolidate'),
dust = require('dustjs-helpers'),
pg = require('pg'),
fs =require('fs'),
copyTo= require('pg-copy-streams').to,
copyFrom=require('pg-copy-streams').from,
stream=require('stream'),
http=require('http'),
ejs=require('ejs'),
multer=require('multer'),
streamifier=require('streamifier'),
cluster=require('cluster'),
app = express();
var port =process.env.PORT ||8080;

// restarts server if errors (in case files uploaded have same information)
if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}
// wraps whole application in server restart- unhandled exception 
if (cluster.isWorker) {

//const { Pool, Client} = require('pg')
//const connectionString = 'postgresql://postgres:postgres123@localhost:3000/crudapp'
//change on deploy
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();


//Set Default ext .dust

app.engine('dust',cons.dust);
app.engine('ejs',cons.ejs)
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');
app.set('view engine','ejs')
app.set('views',__dirname+'/views');

//Set public folder

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/query',function(req,res){
client.connect();
client.query('SELECT * FROM sqldata',function(err,result){
    if(err) {
        return console.error('error running query',err);
    }
    res.render('index.dust',{sqldata:result.rows});
    
})
    
});

app.post('/add',function(req,res){
    
    client.query ('INSERT INTO sqldata(name,query,des) VALUES($1,$2,$3)',[req.body.name,req.body.query,req.body.des]
    
);
    res.redirect('/query');
    
});

app.delete('/delete/:id',function(req,res){
   
    client.query("DELETE FROM sqldata WHERE id = $1",
        [req.params.id]);
        res.redirect(200,'/query')
    
});

//edit
app.post('/edit',function(req,res){
    client.query("UPDATE sqldata SET name=$1,query=$2,des=$3 WHERE id =$4",[req.body.name,req.body.query,req.body.des,req.body.id]);
    res.redirect('/query')
})

//main page



app.get('/', function (req, res) {
    client.connect();
    
    client.query('SELECT * FROM sqldata', function (err, result) {
        if (err) {
            return console.error('error running query', err);
        }
        res.render('download.ejs', { sqldata: result.rows });
     
    })


        
});



//pg-copy-stream ---- exports the results

app.post('/stream', (req, res) => {
  
   
  /* write a query variable , plug req.body.selecta ,JSON parse it */
 // var query=(JSON.parse(req.body.selecta))
 // UPDATE : NEW CODE DOES NOT NEED JSON PARSING
  var query=`${req.body.selecta}`
  


    
//change testtable when deploy
    var stream = client.query(copyTo(`COPY ${query} TO STDOUT With CSV HEADER DELIMITER','`));    
        stream.pipe(process.stdout);
        res.attachment('results.csv');
        stream.pipe(res);
        client.query(DO $$ BEGIN IF EXISTS (select * from public."Transactions" where "OrderID" = (select "OrderID" from public."testtable" where "OrderID" is not null order by "DateTime" ASC LIMIT 1)) THEN DELETE from public."testtable"; ELSE insert into public."Transactions" select *, current_timestamp from public."testtable"; END IF; END $$; select * from public."Transactions";
)

    
    })
 // upload
const storage = multer.memoryStorage();
// Init Upload
const upload = multer({
    storage: storage
}).array('csvfile', 2);
 
app.post('/upload',(req,res)=>{
    upload(req,res, (err)=>{

        if(err) {
            res.redirect('./',{
                msg:err
            });
        }else {
            
            res.redirect('./');
        }
    
        /*beginning file upload 
        /*postgres from*/
        
        var fileup1=streamifier.createReadStream(req.files[0].buffer)
        var fileup2=streamifier.createReadStream(req.files[1].buffer)
        client.connect();
        var streamFile1= client.query(copyFrom(`COPY fbai FROM STDIN With CSV HEADER DELIMITER ','`));
        
        fileup1.pipe(streamFile1);       
        var streamFile2 = client.query(copyFrom(`COPY testtable FROM STDIN With CSV HEADER DELIMITER ','`));
        
        fileup2.pipe(streamFile2);
      
 
    });
});


//Server
app.listen(port, function () {
    console.log('server started')
});
}