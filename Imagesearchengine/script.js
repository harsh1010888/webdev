const searchForm = document.getElementById("searchbar");
const searchBox = document.getElementById("search-box");
const result = document.getElementById("searchresult");
const showMore = document.getElementById("showmore");

const accessKey = "8hy9gvKoHZFTAvGoAtqQiE00C0_LI75l5A4wySHy-VE";
let keyword = "";
let page = 1;

async function searchImages() {
    keyword = searchBox.value.trim(); // Trim spaces for better search
    if (keyword === "") return; // Prevent empty searches

    const url = `https://api.unsplash.com/search/photos?page=${page}&query=${keyword}&client_id=${accessKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (page === 1) result.innerHTML = ""; // Clear results only for new search

        const results = data.results;
        if (results.length === 0) {
            result.innerHTML = "<p>No results found.</p>";
            showMore.style.display = "none";
            return;
        }

        results.forEach((item) => {
            const image = document.createElement("img");
            image.src = item.urls.small;
            image.alt = item.alt_description;
            image.style.margin = "10px";
            image.style.width = "200px";

            result.appendChild(image);
        });

        showMore.style.display = "block"; // Show "Show More" button if images exist
    } catch (error) {
        console.error("Error fetching data:", error);
        result.innerHTML = "<p>Something went wrong. Try again!</p>";
    }
}

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    page = 1; // Reset to first page on new search
    searchImages();
});


showMore.addEventListener("click", () => {
    page++; // Increase page number for next set of images
    searchImages();
});
