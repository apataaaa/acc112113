class SpaceshipScene {
    constructor() {
        this.uiElement = document.getElementById('spaceship-ui');
        this.hitbox = document.getElementById('record-player-hitbox');

        this.onRecordPlayerClick = this.onRecordPlayerClick.bind(this);

        // Background music
        this.bgMusic = null;
    }

    enter() {
        console.log("Entering Spaceship Scene");
        this.uiElement.style.display = 'block';

        // Add event listeners
        this.hitbox.addEventListener('click', this.onRecordPlayerClick);

        // Play background music
        if (!this.bgMusic) {
            this.bgMusic = new Audio('assets/audio/mainmusi.mp3');
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.5;
        }
        this.bgMusic.play().catch(err => console.log('Audio play failed:', err));
    }

    exit() {
        console.log("Exiting Spaceship Scene");
        this.uiElement.style.display = 'none';

        // Remove event listeners
        this.hitbox.removeEventListener('click', this.onRecordPlayerClick);

        // Stop background music
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
    }

    onRecordPlayerClick() {
        console.log("Record Player Clicked!");
        window.game.switchTo('galaxy');
    }

    // Temporary Debug Helper
    setupDebugCoords() {
        this.uiElement.addEventListener('click', (e) => {
            // Ignore if clicking the button itself
            if (e.target === this.hitbox || this.hitbox.contains(e.target)) return;

            const rect = this.uiElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = Math.round((x / rect.width) * 100);
            const yPercent = Math.round((y / rect.height) * 100);

            alert(`您點擊的位置是：\nLeft: ${xPercent}%\nTop: ${yPercent}%`);
        });
    }
}
