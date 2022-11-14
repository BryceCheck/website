export const parseName = (first, last) => {
    var title;
    if(first && last) {
      title = `${first} ${last}`
    } else if(first && !last) {
      title = `${first}`
    } else {
      title = '';
    }
    return title;
};