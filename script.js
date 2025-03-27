document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const booksContainer = document.getElementById('books-container');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort');
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const loadingElement = document.getElementById('loading');

    // State variables
    let books = [];
    let filteredBooks = [];
    let currentPage = 1;
    let isLoading = false;
    let hasMoreBooks = true;

    // Initialize the app
    init();

    function init() {
        fetchBooks();
        setupEventListeners();
    }

    function setupEventListeners() {
        // View toggle
        gridViewBtn.addEventListener('click', () => {
            booksContainer.classList.remove('list-view');
            booksContainer.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        });

        listViewBtn.addEventListener('click', () => {
            booksContainer.classList.remove('grid-view');
            booksContainer.classList.add('list-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
        });

        // Search functionality
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });

        // Sort functionality
        sortSelect.addEventListener('change', () => {
            sortBooks();
            renderBooks();
        });

        // Infinite scroll
        window.addEventListener('scroll', handleScroll);
    }

    async function fetchBooks() {
        if (isLoading || !hasMoreBooks) return;

        isLoading = true;
        loadingElement.style.display = 'block';

        try {
            const response = await fetch(`https://api.freeapi.app/api/v1/public/books?page=${currentPage}&limit=12`);
            const data = await response.json();

            if (data.success && data.data && data.data.data) {
                const newBooks = data.data.data;

                if (newBooks.length === 0) {
                    hasMoreBooks = false;
                    loadingElement.style.display = 'none';
                    return;
                }

                books = [...books, ...newBooks];
                filteredBooks = [...books];

                sortBooks();
                renderBooks();

                currentPage++;
            } else {
                console.error('API response format unexpected:', data);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            isLoading = false;
            loadingElement.style.display = 'none';
        }
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();

        if (searchTerm === '') {
            filteredBooks = [...books];
        } else {
            filteredBooks = books.filter(book =>
                (book.volumeInfo.title && book.volumeInfo.title.toLowerCase().includes(searchTerm)) ||
                (book.volumeInfo.authors && book.volumeInfo.authors.some(author =>
                    author.toLowerCase().includes(searchTerm)))
            );
        }

        sortBooks();
        renderBooks();
    }

    function sortBooks() {
        const sortValue = sortSelect.value;

        filteredBooks.sort((a, b) => {
            const titleA = a.volumeInfo.title || '';
            const titleB = b.volumeInfo.title || '';
            const dateA = a.volumeInfo.publishedDate || '';
            const dateB = b.volumeInfo.publishedDate || '';

            switch (sortValue) {
                case 'title-asc':
                    return titleA.localeCompare(titleB);
                case 'title-desc':
                    return titleB.localeCompare(titleA);
                case 'date-asc':
                    return dateA.localeCompare(dateB);
                case 'date-desc':
                    return dateB.localeCompare(dateA);
                default:
                    return 0;
            }
        });
    }

    function renderBooks() {
        booksContainer.innerHTML = '';

        if (filteredBooks.length === 0) {
            booksContainer.innerHTML = '<p class="no-results">No books found. Try a different search term.</p>';
            return;
        }

        filteredBooks.forEach(book => {
            const bookCard = createBookCard(book);
            booksContainer.appendChild(bookCard);
        });
    }

    function createBookCard(book) {
        const volumeInfo = book.volumeInfo || {};
        const card = document.createElement('div');
        card.className = 'book-card';

        // Thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.className = 'book-thumbnail';
        thumbnail.src = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/150x200?text=No+Image';
        thumbnail.alt = volumeInfo.title || 'Book cover';
        thumbnail.onerror = function () {
            this.src = 'https://via.placeholder.com/150x200?text=No+Image';
        };

        // Info container
        const info = document.createElement('div');
        info.className = 'book-info';

        // Title
        const title = document.createElement('h2');
        title.className = 'book-title';
        title.textContent = volumeInfo.title || 'Untitled';

        // Author
        const author = document.createElement('p');
        author.className = 'book-author';
        author.textContent = volumeInfo.authors ? `by ${volumeInfo.authors.join(', ')}` : 'Author unknown';

        // Publisher
        const publisher = document.createElement('p');
        publisher.className = 'book-publisher';
        publisher.textContent = volumeInfo.publisher ? `Published by ${volumeInfo.publisher}` : '';

        // Published date
        const date = document.createElement('p');
        date.className = 'book-date';
        date.textContent = volumeInfo.publishedDate ? `Published on ${volumeInfo.publishedDate}` : '';

        // Assemble the card
        info.appendChild(title);
        info.appendChild(author);
        info.appendChild(publisher);
        info.appendChild(date);

        card.appendChild(thumbnail);
        card.appendChild(info);

        // Add click event to open more details
        if (volumeInfo.infoLink) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.open(volumeInfo.infoLink, '_blank');
            });
        }

        return card;
    }

    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

        if (scrollTop + clientHeight >= scrollHeight - 100 && !isLoading && hasMoreBooks) {
            fetchBooks();
        }
    }
});