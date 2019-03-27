// Global app controler
import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import { elements, renderLoader, clearLoader } from './views/base';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

// *Global state*control the state of your simple app (inreact they use redux)
// -Search object
// -Current recipe obj
// -Shoping list obj
// -liked recipes
const state = {};

/* --SEARCH CONTROLER-- */

const controlSearch = async () => {
  // 1- get query from the view
  const query = searchView.getInput(); // todo

  if (query) {
    // 2- new search obj and add to state
    state.search = new Search(query);
    // 3 - Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      // 4 - Search recipes
      await state.search.getResults();
      // 5 - Render results on the UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      console.log(error);
      alert('Error from controlSearch');
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  // to always target btn inline, even if click on icons
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/* --RECIPE CONTROLER-- */

const controlRecipe = async () => {
  // Get id from url
  const id = window.location.hash.replace('#', '');

  if (id) {
    // Prepare Ui for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    // highlight selected search item
    if (state.search) searchView.highlightSelected(id);
    // Create new recipe Object/
    state.recipe = new Recipe(id);

    try {
      // Get recipe Data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      // calc serving and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      // render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      alert('error processing recipe');
    }
  }
};

// window.addEventListener('hashchange', controlRecipe);
// load used to get the id from the has so the page doesnt reload blank
// window.addEventListener('load', controlRecipe);
// can be written this way
['hashchange', 'load'].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/* --LIST CONTROLER-- */
const controlList = () => {
  // create a new list if there none yet
  if (!state.list) state.list = new List();
  // add each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

/* --LIKE CONTROLER-- */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  // User has NOT yet likes current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // toggle the like button
    likesView.toggleLikeBtn(true);
    // Add like to UI list
    likesView.renderLike(newLike);

    // User HAS yet likes current recipe
  } else {
    // Remove like to the state
    state.likes.deleteLike(currentID);
    // toggle the like button
    likesView.toggleLikeBtn(false);
    // Remove like to UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumberLike());
};

// EVENT DELAGATIONS

// Restore liked recipes on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  // Restore likes
  state.likes.readStorage();

  // toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumberLike());

  // Render the existing likes
  state.likes.likes.forEach(like => {
    likesView.renderLike(like);
  });
});

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;
  // Handle the delete button
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);
    // Delete from ui
    listView.deleteItem(id);

    // Handle count update
  } else if (e.target.matches('.shopping__count--value')) {
    const val = parseFloat(e.target.value, 10);
    if (val >= 0) {
      state.list.updateCount(id, val);
    }
  }
});

// Handling recipe button clicks (event delegation)
elements.recipe.addEventListener('click', e => {
  // means if it matche btn decrease or any child of it
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // decrease is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServIng(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    // increase is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServIng(state.recipe);
    // shopping part
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Add ingredients to shipping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Like controler
    controlLike();
  }
});
