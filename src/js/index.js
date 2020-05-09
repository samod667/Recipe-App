import Search from './models/Search'
import Recipe from './models/Recipe'
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from './views/SearchView';
import * as recipeView from "./views/RecipeView";
import * as listView from "./views/ListView";
import * as likesView from "./views/LikesView";
import { elements, renderLoader, clearLoader } from './views/base'

// GLOBAL STATE OF THE APP
// - SEARCH OBJECT
// - Current Recipe object
//- SHOPPING LIST OBJECT
// - LIKED RECIPES
const state = {} 


//SEARCH CONTROLLER
const controlSearch = async () => {
    // 1. get the query from the view 
    const query = searchView.getInput();
    
    if (query) {
        // 2. NEW SEARCH OBJECT AND ADD TO STATE
        state.search = new Search(query);

        //3. PREPARE UI FOR RESULTS
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes)

        try {
        //4. SEARCH FOR RECIPES
        await state.search.getResults()

        //5. RENDER RESULTS ON UI
        clearLoader()
        searchView.renderResults(state.search.result)
        } catch (error) {
            alert('Something is wrong with your search')
            clearLoader();
        }
    };
};


elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();

});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

//RECIPE CONTROLLER

const controlRecipe = async () => {
    //GET ID FROM URL
    const id = window.location.hash.replace('#', '')

    if(id){
        //PREPARE THE UI TO CHANGES
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        //HIGHLIGHT RESULTS

        if (state.search) searchView.highlightedSelected(id)

        //CREATE A NEW RECIPE OBJ
        state.recipe = new Recipe(id);
        //TESTING
        //window.r = state.recipe
        try {
              //GET THE RECIPE DATA AND PARSE ING
              await state.recipe.getRecipe();
              //console.log(state.recipe.ingredients)
              state.recipe.parseIngredients();
              //CALC TIME CALC SERVINGS
              state.recipe.calcTime();
              state.recipe.calcServings();
              //RENDER THE RECIPE
              clearLoader()
              recipeView.renderRecipe(
                  state.recipe,
                  state.likes.isLiked(id)
                  )
              //console.log(state.recipe)
            } catch (error) {
                console.log(error)
            }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe))


//LIST CONTROLLER

const controlList = () => {
    //CREATE A NEW LIST IF THERE IS NONE YET
    if (!state.list) state.list = new List();
    
    //ADD EACH ING TO THE LIST AND UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
};

//HANDLE DELETE AND UPDATE LIST ITEM EVENTS
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //HANDLE DELETE EVENT

    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // DELETE FROM STATE
        state.list.deleteItem(id);
        // DELETE ITEM FROM UI
        listView.deleteItem(id);
    } else if (e.target.matches(".shopping__count-value")) {
        const val = parseFloat(e.target.value, 10); 
        state.list.updateCount(id, val)
    }
})

// LIKES CONTROLLER
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id

    //USER HAS NOT YET LIKED CUR RECIPE
    if (!state.likes.isLiked(currentID)) {
        // ADD LIKE TO THE STATE
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        //TOGGLE THE LIKE BUTTON
        likesView.toggleLikeBtn(true);
        //ADD LIKE TO THE UI LIST
        likesView.renderLike(newLike)
        
    //USER HAS LIKED CUR RECIPE
    } else{
        //REMOVE LIKE TO THE STATE
        state.likes.deleteLike(currentID)
        //TOGGLE THE LIKE BUTTON
        likesView.toggleLikeBtn(false);
        //REMOVE LIKE TO THE UI LIST
        likesView.deleteLike(currentID)
    }
    likesView.toggleLikeMenu(state.likes.getNumOfLikes())
};


//RESTORE LIKE REC ON PAGE LOAD

window.addEventListener('load', () => {
    state.likes = new Likes();

    //RESTORE LIKES
    state.likes.readStorage();

    //TOGGLE BTN
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());

    //RENDER THE EXT LIKES
    state.likes.likes.forEach(like => likesView.renderLike(like))
})

//RECIPE BUTTON CLICKS
elements.recipe.addEventListener('click', e => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")) {
      //DECREASE BTN IS CLICKED
      if (state.recipe.servings > 1){
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
      } 
    } else if (e.target.matches(".btn-increase, .btn-increase *")) {
      //INCREASE BTN IS CLICKED
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
        //ADD TO SHOPPING LIST
        controlList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")) {
        // LIKE CONTROLLER
        controlLike();
    }
    
});
