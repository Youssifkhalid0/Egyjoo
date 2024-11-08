let db;
const DB_NAME = 'VideoDatabase';
const STORE_NAME = 'videos';

document.addEventListener('DOMContentLoaded', function() {
    const videoGrid = document.getElementById('video-grid');
    const subcategoryButtons = document.querySelectorAll('.subcategory-btn');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    const dbRequest = indexedDB.open(DB_NAME, 1);

    dbRequest.onerror = function(event) {
        console.error("IndexedDB error:", event.target.error);
    };

    dbRequest.onsuccess = function(event) {
        db = event.target.result;
        displayVideos();
    };

    dbRequest.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("category", "category", { unique: false });
        objectStore.createIndex("subcategory", "subcategory", { unique: false });
    };

    function displayVideos(subcategory = '', searchTerm = '') {
        videoGrid.innerHTML = '';
        const objectStore = db.transaction(STORE_NAME).objectStore(STORE_NAME);
        const category = getCategoryFromPage();

        objectStore.index("category").openCursor(category).onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const video = cursor.value;
                if (
                    (subcategory === '' || video.subcategory === subcategory) &&
                    (searchTerm === '' || video.title.toLowerCase().includes(searchTerm.toLowerCase()))
                ) {
                    const videoCard = createVideoCard(video);
                    videoGrid.appendChild(videoCard);
                }
                cursor.continue();
            }
        };
    }

    function getCategoryFromPage() {
        const path = window.location.pathname;
        if (path.includes('movies')) return 'movies';
        if (path.includes('cartoons')) return 'cartoons';
        if (path.includes('sports')) return 'sports';
        return '';
    }

    function createVideoCard(video) {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description.substring(0, 60)}...</p>
                <div class="video-rating">
                    ${'★'.repeat(video.rating)}${'☆'.repeat(5 - video.rating)}
                </div>
            </div>
        `;
        videoCard.addEventListener('click', () => {
            window.location.href = `video.html?id=${video.id}`;
        });
        return videoCard;
    }

    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        displayVideos('', searchTerm);
    });

    subcategoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            subcategoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const subcategory = this.dataset.category;
            displayVideos(subcategory);
        });
    });

    displayVideos();
});

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}