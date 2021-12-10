const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const router_viewer = express.Router();
const router_editor = express.Router();
const router_queries = express.Router();
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
        case 'editor':
            clients.get(id).render("editor", {
                page: req.body.page,
                multiple_classes: req.body.multiple_classes,
                classes: req.body.classes,
                multiple_individuals: req.body.multiple_individuals,
                individuals: req.body.individuals,
                multiple_data_properties: req.body.multiple_data_properties,
                dataProperties: req.body.dataProperties,
                multiple_object_properties: req.body.multiple_object_properties,
                objectProperties: req.body.objectProperties,
                feedback: req.body.message
            });
            break;
        case 'editClass':
            clients.get(id).render("editing_class", {
                page: req.body.page,
                title: 'Editing Class: ' + req.body.className,
                hasComment: req.body.hasComment,
                comment: req.body.comment,
                oldName: req.body.className,
                parentClasses: req.body.parentClasses,
                multiple_parent_classes: req.body.multiple_parent_classes,
                otherClasses: req.body.otherClasses,
                multiple_other_classes: req.body.multiple_other_classes
            });
            break;
        case 'editIndividual':
            clients.get(id).render("editing_individual", {
                page: req.body.page,
                individual: 'Editing Individual: ' + req.body.individual,
                hasComment: req.body.hasComment,
                comment: req.body.comment,
                oldName: req.body.individual,
                parentClass: req.body.parentClass,
                classes: req.body.classes,
                multiple_classes: req.body.multiple_classes,
                usedDataProperties: req.body.usedDataProperties,
                multiple_used_data_properties: req.body.multiple_used_data_properties,
                otherDataProperties: req.body.otherDataProperties,
                multiple_other_data_properties: req.body.multiple_other_data_properties,
                usedObjectProperties: req.body.usedObjectProperties,
                multiple_used_object_properties: req.body.multiple_used_object_properties,
                otherObjectProperties: req.body.otherObjectProperties,
                multiple_other_object_properties: req.body.multiple_other_object_properties,
                otherIndividuals: req.body.otherIndividuals,
                multiple_other_individuals: req.body.multiple_other_individuals
            });
            break;
        case 'editDataProperty':
            clients.get(id).render("editing_data_property", {
                page: req.body.page,
                dataProperty: 'Editing Data Property: ' + req.body.dataProperty,
                hasComment: req.body.hasComment,
                comment: req.body.comment,
                oldName: req.body.dataProperty
            });
            break;
        case 'editObjectProperty':
            clients.get(id).render("editing_object_property", {
                page: req.body.page,
                objectProperty: 'Editing Object Property: ' + req.body.objectProperty,
                hasComment: req.body.hasComment,
                comment: req.body.comment,
                oldName: req.body.objectProperty,
                transitive: req.body.transitive,
                asymmetric: req.body.asymmetric,
                symmetric: req.body.symmetric,
                reflexive: req.body.reflexive,
                irreflexive: req.body.irreflexive,
                functional: req.body.functional,
                inverseFuncional: req.body.inverseFuncional
            });
            break;
        case 'viewer':
            clients.get(id).render("viewer", {
                page: req.body.page,
                tabela1: req.body.tabela1
            });
            break;
        case 'queries':
            clients.get(id).render("queries", {
                page: req.body.page,
                answers: req.body.answers,
                multiple_answers: req.body.multiple_answers,
                classes: req.body.classes,
                multiple_classes: req.body.multiple_classes,
                dataProperties: req.body.dataProperties,
                multiple_data_properties: req.body.multiple_data_properties
            });
            break;
        default:
            console.log(`Sorry, we are out of ${nextPage}.`);
    }
    clients.delete(id)
    res.send("Post sent")
}





app.use("/viewer", router_viewer);
router_viewer.get('*', handle_client_viewer)
router_viewer.post('*', handle_client_viewer)
function handle_client_viewer(req, res) {
    console.log(req.path);
    if (docker_clients.length > 0) {
        console.log(docker_clients.length)
        console.log(req.body)
        client_id += 1
        response_obj = {
            client_id: client_id,
            url: req.path,
            data: {
                pedido: "viewer"
            }
        }
        docker = docker_clients.pop()
        docker.send(response_obj)
        docker = null
        clients.set(client_id, res)
    } else {
        res.send("Docker not connected!")
    }
}

app.use("/editor", router_editor);
router_editor.get('*', handle_client_editor)
router_editor.post('*', handle_client_editor)
function handle_client_editor(req, res) {
    console.log(req.body);
    if (docker_clients.length > 0) {
        console.log(docker_clients.length)
        console.log(req.body)
        client_id += 1
        response_obj = {
            client_id: client_id,
            url: req.path,
            data: {
                pedido: "editor"
            }
        }
        docker = docker_clients.pop()
        docker.send(response_obj)
        docker = null
        clients.set(client_id, res)
    } else {
        res.send("Docker not connected!")
    }
}

app.use("/queries", router_queries);
router_queries.get('*', handle_client_queries)
router_queries.post('*', handle_client_queries)
function handle_client_queries(req, res) {
    console.log(req.body);
    if (docker_clients.length > 0) {
        console.log(docker_clients.length)
        console.log(req.body)
        client_id += 1
        response_obj = {
            client_id: client_id,
            url: req.path,
            data: {
                pedido: "queries"
            }
        }
        docker = docker_clients.pop()
        docker.send(response_obj)
        docker = null
        clients.set(client_id, res)
    } else {
        res.send("Docker not connected!")
    }
}


app.use("/curator", router_client);
app.use("/boop", router_client);
app.use("/checkCuratorIsValid", router_client);
app.use("/changeCuratorBranch", router_client);
app.use("/curatorAction", router_client);
app.use("/createClass", router_client);
app.use("/createIndividual", router_client);
app.use("/createDataProperty", router_client);
app.use("/createObjectProperty", router_client);
app.use("/editClass", router_client);
app.use("/editIndividual", router_client);
app.use("/editDataProperty", router_client);
app.use("/editObjectProperty", router_client);
app.use("/deleteStuff", router_client);
app.use("/changeClass", router_client);
app.use("/changeIndividual", router_client);
app.use("/changeDataProperty", router_client);
app.use("/changeObjectProperty", router_client);
app.use("/formQuery", router_client);
app.use("/stringQuery", router_client);

router_client.get('*', handle_client_request)
router_client.post('*', handle_client_request)

function handle_client_request(req, res) {
  console.log(req.path);
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