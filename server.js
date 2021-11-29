const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router_client = express.Router();
const router_java_get_stuff = express.Router();
const router_java_send_stuff = express.Router();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const port = process.env.PORT || 5000
let docker_clients = []
let client_id = 0
let clients = new Map()

app.set('view engine', 'pug');
app.set('views', './views');

app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

app.get('/', (req, res) => {
    res.render("index", { title: "Hey", message: "Hello there!" });
})

app.get('/curatorauth', (req, res) => {
    res.render("curatorauth");
});

app.get('/about', (req, res) => {
    res.render("about", { title: "Hey", message: "Hello there!" });
})


app.use("/server_client", router_java_get_stuff);
router_java_get_stuff.get('*', handle_java_connection)
router_java_get_stuff.post('*', handle_java_connection)

function handle_java_connection(req, res) {
    console.log("hello?");
    docker_clients.unshift(res)
    res.setTimeout(20000, () => {
        res.send("Timed out")
        docker_clients.splice(docker_clients.indexOf(res), 1)
    })
}



app.use("/server_client_post", router_java_send_stuff);
router_java_send_stuff.get('*', handle_java_recieve)
router_java_send_stuff.post('*', handle_java_recieve)

function handle_java_recieve(req, res) {
    console.log("got stuff?");
    let id = parseInt(req.body.id)
    clients.get(id).send(req.body.data)
    clients.delete(id)
    res.send("Post sent")
}





app.use("/viewer", router_client);
app.use("/curator", router_client);
app.use("/editor", router_client);
app.use("/boop", router_client);
app.use("/checkCuratorIsValid", router_client);

router_client.get('*', handle_client_request)
router_client.post('*', handle_client_request)

function handle_client_request(req, res) {
    console.log(req.body)
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