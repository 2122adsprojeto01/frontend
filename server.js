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
app.use(express.static('./css'));
app.use(express.static('./js'));

app.listen(port, () => {
  console.log('ADS App listening on port ' + port)
})

app.get('/', (req, res) => {
    res.render("index", { title: "Hey", message: "Hello there!" });
})

app.get('/curatorauth', (req, res) => {
    res.render("curatorauth", {message: ""});
});

app.get('/about', (req, res) => {
    res.render("about", { title: "Hey", message: "Hello there!" });
})


app.use("/server_client", router_java_get_stuff);
router_java_get_stuff.get('*', handle_java_connection)
router_java_get_stuff.post('*', handle_java_connection)

function handle_java_connection(req, res) {
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
    let id = parseInt(req.body.id)
    let nextPage = req.body.nextPage
    console.log(req.body);
    switch (nextPage) {
        case 'curatorauth':
            clients.get(id).render("curatorauth", { message: req.body.message });
            break;
        case 'curator':
            clients.get(id).render("curator", {
                branches: req.body.branch,
                mainBranch: req.body.mainBranch,
                branchContent: req.body.branchContent,
                branchName: req.body.branchName,
                email: req.body.email,
                message: req.body.message,
                multiple_branches: req.body.multiple_branches,
                currversion: req.body.currversion
            });
            console.log("was authenticated and came here");
            break;
        case 'curatorPickedBranch':
            clients.get(id).render("curator", {
                branches: req.body.branch,
                mainBranch: req.body.mainBranch,
                branchContent: req.body.branchContent,
                branchName: req.body.branchName,
                email: req.body.email,
                message: req.body.message,
                multiple_branches: req.body.multiple_branches,
                currversion: req.body.currversion
            });
            console.log("and then came here");
        case 'editorSucess':
            console.log('Mangoes and papayas are $2.79 a pound.');
            // expected output: "Mangoes and papayas are $2.79 a pound."
            break;
        default:
            console.log(`Sorry, we are out of ${nextPage}.`);
    }
    clients.delete(id)
    res.send("Post sent")
}





app.use("/viewer", router_client);
app.use("/curator", router_client);
app.use("/editor", router_client);
app.use("/boop", router_client);
app.use("/checkCuratorIsValid", router_client);
app.use("/changeCuratorBranch", router_client);
app.use("/curatorAction", router_client);

router_client.get('*', handle_client_request)
router_client.post('*', handle_client_request)

function handle_client_request(req, res) {
  if (docker_clients.length > 0){
      console.log(docker_clients.length)
      console.log(req.body)
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