reference: https://stackoverflow.com/questions/3344804/how-to-make-matched-text-bold-with-jquery-ui-autocomplete for the regrex used for wrapping span  
music data came from https://github.com/voltraco/genres

### Provide suggestions while you type into the field.

- [x] +5 marks – when type in a, you should list all strings in the data file that contain a anywhere in the string.
- [x] +10 marks - use blue font to display the first matched substring and bold font for the remaining part of the suggestion. User types in ‘tab’, like ‘**da**<span style = "color : blue;">tab</span>**ase systems**’ will be shown. 
  - matched substring are wrapped by span classed 'ui-autocomplete-term' in the function _renderMenu, which is styled by css
- [x] +5 marks – use blue font display all the matched substring in each item. Eg input ‘a’, suggestions should be ‘**d**<span style = "color : blue;">a</span>**t**<span style = "color : blue;">a</span>**b**<span style = "color : blue;">a</span>**se**' (Quarry : a)
    - use regex with option 'gi'

### Extended Function: Scrollable Results

- [x] +20 marks can scroll through the results ◦ please specify the query to show the scrollable result. (Quarry : a)
  - Done in style.css  

### Extended Function: Categories

- [x] +10 marks display items under its category
    - Done in render Menu, require data to be sorted/grouped according to category
- [x] +10 marks display the category name in red color
    - Done in style.css
- [x] +10 marks display items separately that don’t belong to any category
    - Done in render Menu, item not belong to any category are prepanded to menu
    - I added some uncategoried data wich can be quarried with 'a'

### Extended Function: Multiple Values

- [x] +10 marks we can input multiple terms. For each term, the auto complete function works
    - Function search is overiden to search only the last term. Text replacement is changed in function _create by removing base event handler and adding our own menuselect function.
- [x] +10 marks all the input terms should be displayed in the input box
    - Done in _create by removing base event handler and adding our own menufocus function. works with up/down arrow, showing the input before the last input term plus the selected item
- [x] +10 marks for every input term, can fulfill all the requirements as mentioned before.



