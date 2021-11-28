const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const port = process.env.PORT || 5000
let docker_clients = []
let client_id = 0
let clients = new Map()

app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

app.get('/', (req, res) => {
    res.render("index", { title: "Hey", message: "Hello there!" });
})

app.get('/about', (req, res) => {
    res.render("about", { title: "Hey", message: "Hello there!" });
})

router.get('/server_client', (req, res) => {
  docker_clients.unshift(res)
  res.setTimeout(20000, () => {
    res.send("Timed out")
    docker_clients.splice(docker_clients.indexOf(res), 1)
  })
})

router.post("/server_client_post", (req, res) => {
  let id = parseInt(req.body.id)
  clients.get(id).send(req.body.data)
  clients.delete(id)
  res.send("Post sent")
});

app.set('view engine', 'pug');
app.set('views', './views');

app.use("/boop", router);

router.get('*', handle_client_request)

router.post('*', handle_client_request)

function handle_client_request(req, res){
  if (docker_clients.length > 0){
    console.log(docker_clients.length)
    client_id += 1
    response_obj = {
      client_id:client_id,
      url:req.path,
      data:req.body             //req.body -> dados do POST
    }
    docker = docker_clients.pop()
    docker.send(response_obj)
    docker = null
    clients.set(client_id, res)
  }else{
    res.send("Docker not connected!")
  }
}