
async function checkPrItem() {
    try {
        const res = await fetch("http://localhost:5000/api/pr-item");
        const data = await res.json();
        console.log(data[0]);
    } catch (e) {
        console.error(e);
    }
}
checkPrItem();
