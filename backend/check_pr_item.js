
async function checkPrItem() {
    try {
        const res = await fetch("http://192.168.10.10:5000/api/pr-item");
        const data = await res.json();
        console.log(data[0]);
    } catch (e) {
        console.error(e);
    }
}
checkPrItem();
