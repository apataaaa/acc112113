
class GameManager {
    constructor() {
        this.currentScene = null;
        this.scenes = {};

        // Initialize Scene Containers
        this.uiLayer = document.getElementById('ui-layer');
    }

    addScene(name, sceneObject) {
        this.scenes[name] = sceneObject;
    }

    switchTo(sceneName) {
        console.log(`Switching to scene: ${sceneName}`);

        // Cleanup current scene
        if (this.currentScene) {
            this.currentScene.exit();
        }

        // Initialize new scene
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene) {
            this.currentScene.enter();
        } else {
            console.error(`Scene '${sceneName}' not found!`);
        }
    }
}

const game = new GameManager();
window.game = game; // Expose to global scope for easy access

// Load Scenes
// We will import and instantiate scenes here once they are written.
// For now, let's setup the initial load.

window.addEventListener('DOMContentLoaded', () => {
    // Import scenes dynamically or assume they are loaded via script tags
    if (typeof SpaceshipScene !== 'undefined') {
        game.addScene('spaceship', new SpaceshipScene());
    }
    if (typeof GalaxyScene !== 'undefined') {
        game.addScene('galaxy', new GalaxyScene());
    }
    if (typeof ConcertScene !== 'undefined') {
        game.addScene('concert', new ConcertScene());
    }
    if (typeof ConcertScene !== 'undefined') {
        game.addScene('concert', new ConcertScene());
    }

    // Start with Spaceship scene
    game.switchTo('spaceship');
});
