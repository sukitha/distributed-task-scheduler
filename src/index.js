const { plugins, createServer } = require("restify");
const { config } = require("./Utils/Config");
const { TaskAPI } = require("./TaskAPI");
const { TaskScheduler } = require("./TaskScheduler");
const { TaskWorker } = require("./TaskWorker");

const taskAPi = new TaskAPI();
const taskScheduler = new TaskScheduler();
const taskWorker = new TaskWorker();

const server = createServer({
    name: "DistributedWorker",
    version: ["1.0.0"]
});

server.use(
    plugins.bodyParser({
        mapParams: true
    })
);

server.listen(config.get("port"), function () {
    console.log(`${server.name} listening at ${server.url}`);
});

console.log(`Service started on ${config.get("port")}`);

server.post(
    "/tasks/:queue",
    plugins.conditionalHandler([
        { version: "1.0.0", handler: taskAPi.SaveTask }
    ])
);


taskScheduler.ProcessEvents('queue1');
taskWorker.ProcessTasks('queue1');