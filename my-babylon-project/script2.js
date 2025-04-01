import { engRowLower, engRowUpper, keyNames } from "./words.js";
import { MyplayerId, otherPlayerId } from "./createroom.js";

const ws = new WebSocket("ws://localhost:8081"); // Connect to WS server

ws.onopen = () => {
  console.log("Connected to WS server");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
  if (data.type === "currentPlayers") {
    console.log("Existing players:", data.players);
  } else if (data.type === "removePlayer") {
    console.log(`Player ${data.id} left`);
  } else if (data.type === "start") {
    show_start();
  }
  switch (data.type) {
    case "currentPlayers":
      console.log("Existing players:", data.players);
      break;
    case "GameStartReal":
      heartGenerate(5);
      light.intensity = 1;
      break;
    case "spawnEnemy":
      spawnEnemy(data.name, data.text, data.randomPosition);
      break;
    case "delete_enermy":
      delete_enermy(data.index);
      break;
    case "delete_heart":
      console.log(data.life)
      delete_heart(data.life);
      break;
    case "checkId":
      if (
        otherPlayerId == data.MyplayerId ||
        otherPlayerId == data.otherPlayerId
      ) {
        console.log("sentother");
        ws.send(JSON.stringify({ type: "sentToOther", otherPlayerId }));
      }
      break;
    case "end":
      enemies.forEach((enemy) => {
        if (enemy.mesh && !enemy.mesh.isDisposed()) {
          enemy.mesh.dispose();
        }
        if (enemy.label && !enemy.label.isDisposed()) {
          enemy.label.dispose();
        }
      });
      enemies.length = 0;
      hearts.length = 0;
      light.intensity = 0.2;
      break;
  }
};

function delete_enermy(indexCorrect) {
  let enemy = enemies[indexCorrect];
  enemy.mesh.dispose();
  enemy.label.dispose();
  enemies.splice(indexCorrect, 1);
  inputWord.splice(indexCorrect, 1);
  textinput = "";
  Score += 1;
}

function delete_heart(life) {
  console.log(hearts,life)
  hearts[life].dispose();
  hearts.splice(life, 1);
}

let start = 0;
let inputWord = [];
let enemies = [];
let indexCorrect = -1;
let keyLow = engRowLower;
let keyUp = engRowUpper;
let textinput = "";
let life = 5;
let hearts = [];
let Bonus_obj;
let Bouns_text;
let Score = 0;
let bossIdel = null;
let bossAtk = null;
let bossDead = null;
let light;

const canvas = document.getElementById("renderCanvas2");
const engine = new BABYLON.Engine(canvas, true);
const createScene = function () {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    800,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.setTarget(BABYLON.Vector3.Zero());

  camera.minZ = 0.1;
  camera.maxZ = 5000;
  camera.setTarget(BABYLON.Vector3.Zero());
     light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(400, 500, 500),
    scene
  );
  light.intensity = 0.2;

  // <========== Create a ground (plane) ==============>

  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 6000, height: 3000 },
    scene
  );

  const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture(
    "/model/brick_wall_005_diff_4k.jpg",
    scene
  );
  groundMaterial.diffuseTexture.uScale = 10;
  groundMaterial.diffuseTexture.vScale = 10;
  ground.material = groundMaterial;
  ground.position = new BABYLON.Vector3(0, 0, 0);

  // <========== Create a road ==============>

  const road = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 500, height: 3000 },
    scene
  );
  const groundMaterial_road = new BABYLON.StandardMaterial(
    "groundMaterial",
    scene
  );
  groundMaterial_road.diffuseTexture = new BABYLON.Texture(
    "/model/rock_embedded_concrete_wall_diff_4k.jpg",
    scene
  );
  groundMaterial_road.diffuseTexture.uScale = 10;
  groundMaterial_road.diffuseTexture.vScale = 60;
  road.material = groundMaterial_road;
  road.position = new BABYLON.Vector3(0, 0, 0);

  // <========== house cat==============>

  // let house_cat = null;
  // BABYLON.SceneLoader.ImportMesh(
  //   "",
  //   "/model/",
  //   "sketchfab_3d_editor_challenge_littlest_tokyo.glb",
  //   scene,
  //   function (meshes, particleSystems, skeletons, animationGroups) {
  //     house_cat = meshes[0];

  //     house_cat.scaling = new BABYLON.Vector3(1, 1, 1);
  //     house_cat.position.set(-900, 200, -900);
  //     house_cat.rotation.y = Math.PI;
  //     house_cat.lookAt(new BABYLON.Vector3(500, 150, -800));
  //   },
  //   function (progress) {}
  // );

  let tree = null;
  BABYLON.SceneLoader.ImportMesh(
    "",
    "/model/",
    "treea.glb",
    scene,
    function (meshes, particleSystems, skeletons, animationGroups) {
      tree = meshes[0];

      tree.scaling = new BABYLON.Vector3(800, 800, 800);
      tree.position.set(600, 0, -500);
      tree.rotation.y = Math.PI;
      tree.lookAt(new BABYLON.Vector3(0, 0, 0));
    },
    function (progress) {}
  );
  let treese = [];
  for (let i = 0; i < 5; i++) {
    let trees = null;
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/model/",
      "platano_tree.glb",
      scene,
      function (meshes, particleSystems, skeletons, animationGroups) {
        trees = meshes[0];

        trees.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        trees.position.set(-300, 0, -1000 + i * 350);
        trees.rotation.y = Math.PI;
        trees.lookAt(new BABYLON.Vector3(-300, 0, 1000));
        treese.push(trees);
      },
      function (progress) {}
    );
  }

  // <=================== Function to spawn a new enemy ===================== >

  let planeInput = BABYLON.MeshBuilder.CreatePlane(
    "plane",
    { width: 300, height: 100 },
    scene
  );
  planeInput.position = new BABYLON.Vector3(0, 0, 400);

  scene.registerBeforeRender(() => {
    const cameraPosition = scene.activeCamera.position;
    const planePosition = planeInput.position;

    const planeScreenPosition = BABYLON.Vector3.Project(
      planePosition,
      BABYLON.Matrix.Identity(),
      scene.getTransformMatrix(),
      scene.activeCamera.viewport.toGlobal(
        engine.getRenderWidth(),
        engine.getRenderHeight()
      )
    );

    const textDiv = document.getElementById("textDiv");
    textDiv.style.left = `${planeScreenPosition.x - textDiv.offsetWidth / 2}px`;
    textDiv.style.top = `${planeScreenPosition.y - textDiv.offsetHeight / 2}px`;
  });

  return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

// <=================== heart ============================>

function heartGenerate(number) {
  for (let i = 0; i < number; i++) {
    let position = 100;

    BABYLON.SceneLoader.ImportMesh(
      "",
      "/model/",
      "heart_in_love.glb",
      scene,
      function (meshes) {
        const heart = meshes[0];
        if (number == 1) {
          heart.scaling.set(0.2, 0.2, 0.2);
          heart.position.set(position - hearts.length * 50, 50, 400);
          heart.lookAt(
            new BABYLON.Vector3(position - hearts.length * 50, 50, 900)
          );
          life += 1;
          hearts.push(heart);
          return;
        }
        heart.scaling.set(0.2, 0.2, 0.2);
        heart.position.set(position - i * 50, 50, 400);
        heart.lookAt(new BABYLON.Vector3(position - i * 50, 50, 900));
        hearts.push(heart);
      }
    );
  }
}

// <=================== listening Key =======================>
function spawnEnemy(name, text, randomPosition, randomNumber) {
  BABYLON.SceneLoader.ImportMesh(
    "",
    "/model/",
    name,
    scene,
    function (meshes) {
      const enemy = meshes[0];

      enemy.scaling = new BABYLON.Vector3(20, 20, 20);
      enemy.position.set(randomPosition.x, 0, randomPosition.z);
      enemy.rotation.y = Math.PI;
      // enemy.lookAt(randomPosition.lookAt);
      let font_size = 80;
      let font = "bold 80px Arial";
      let DTHeight = 1.5 * font_size;

      let speed = 1;
      let colour = "white";
      if (randomNumber == 9) {
        enemy.lookAt(new BABYLON.Vector3(randomPosition.x, 0, -6000));
        (enemy.position.y += 150), (speed = 2);
        colour = "red";
      }
      let tempTexture = new BABYLON.DynamicTexture(
        "tempTexture",
        { width: 1024, height: 512 },
        scene
      );
      let tmpctx = tempTexture.getContext();
      tmpctx.font = font;
      let DTWidth = tmpctx.measureText(text).width + 8;

      let dynamicTexture = new BABYLON.DynamicTexture(
        "DynamicTexture",
        { width: DTWidth, height: DTHeight },
        scene,
        false
      );
      let mat = new BABYLON.StandardMaterial("mat", scene);
      dynamicTexture.update(true);
      mat.diffuseTexture = dynamicTexture;
      mat.diffuseTexture.updateSamplingMode(
        BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST
      );
      dynamicTexture.drawText(text, null, null, font, colour, "black", true);

      let plane = BABYLON.MeshBuilder.CreatePlane(
        "plane",
        { width: DTWidth / 2, height: DTHeight / 3 },
        scene
      );

      plane.material = mat;
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
      plane.isPickable = false;
      plane.position = new BABYLON.Vector3(
        enemy.position.x,
        enemy.position.y + 80,
        enemy.position.z
      );

      tempTexture.dispose();

      const enemyObject = {
        mesh: enemy,
        label: plane,
      };

      let movementObserver = scene.onBeforeRenderObservable.add(() => {
        if (enemy.position.z < 350) {
          enemy.position.z += speed;

          plane.position.x = enemy.position.x;
          plane.position.y = enemy.position.y + 80;
          plane.position.z = enemy.position.z;
          if (speed > 1) {
            plane.position.y -= 120;
            plane.position.z += 75;
          }
        }
      });

      enemies.push(enemyObject);
    },
    function (progress) {}
  );
}
