let db;
const DB_NAME = 'VideoDatabase';
const STORE_NAME = 'videos';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('admin-login-form');
    const adminPanel = document.getElementById('admin-panel');
    const uploadForm = document.getElementById('upload-form');
    const categorySelect = document.getElementById('video-category');
    const subcategorySelect = document.getElementById('video-subcategory');
    const videoManagement = document.getElementById('video-management');

    const ADMIN_PHONE = '01092812463';
    const ADMIN_PASSWORD = 'Aa123456#';

    const subcategories = {
        movies: ['comedy', 'horror', 'new', 'old', 'foreign'],
        cartoons: [],
        sports: ['matches', 'live']
    };

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

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;

        if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
            document.getElementById('login-form').style.display = 'none';
            adminPanel.style.display = 'block';
            displayVideos();
        } else {
            alert('رقم الهاتف أو كلمة المرور غير صحيحة');
        }
    });

    categorySelect.addEventListener('change', function() {
        const category = this.value;
        subcategorySelect.innerHTML = '<option value="">اختر التصنيف الفرعي</option>';
        
        if (subcategories[category]) {
            subcategories[category].forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                subcategorySelect.appendChild(option);
            });
        }
    });

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const videoData = {
            id: Date.now(),
            title: document.getElementById('video-title').value,
            url: document.getElementById('video-url').value,
            description: document.getElementById('video-description').value,
            category: categorySelect.value,
            subcategory: subcategorySelect.value,
            rating: 0,
            comments: [],
            thumbnail: `https://img.youtube.com/vi/${getYouTubeID(document.getElementById('video-url').value)}/0.jpg`
        };

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(videoData);

        request.onsuccess = function(event) {
            alert('تم رفع الفيديو بنجاح!');
            uploadForm.reset();
            displayVideos();
        };

        request.onerror = function(event) {
            console.error("Error adding video:", event.target.error);
            alert('حدث خطأ أثناء رفع الفيديو');
        };
    });

    function displayVideos() {
        videoManagement.innerHTML = '';
        const objectStore = db.transaction(STORE_NAME).objectStore(STORE_NAME);

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                const video = cursor.value;
                const videoElement = document.createElement('div');
                videoElement.className = 'video-item';
                videoElement.innerHTML = `
                    <img src="${video.thumbnail}" alt="${video.title}" style="width: 120px; height: 90px; object-fit: cover;">
                    <h3>${video.title}</h3>
                    <p>الفئة: ${video.category}</p>
                    <p>التصنيف الفرعي: ${video.subcategory || 'غير محدد'}</p>
                    <button onclick="deleteVideo(${video.id})">حذف</button>
                    <a href="${video.url}" target="_blank">مشاهدة</a>
                `;
                videoManagement.appendChild(videoElement);
                cursor.continue();
            }
        };
    }

    window.deleteVideo = function(id) {
        const request = db.transaction([STORE_NAME], "readwrite")
            .objectStore(STORE_NAME)
            .delete(id);
        
        request.onsuccess = function(event) {
            displayVideos();
        };
    };
});

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}