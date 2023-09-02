var sample = {

    // réagir au choix d'une couleur
    colorChange : function(sel)
    {
        var style = document.getElementById('colorStyle');
        style.href = '../../../net-tools/ui/src/ui.' + sel.value + '-theme.css';

		var style = document.getElementById('androidColorStyle');
        if ( style )
            style.href = '../src/android.' + sel.value + '-theme.css';
    },
    
    
    // autoload : écrire liste de choix de couleurs
    writeColorSelection : function()
    {
        var sel = document.getElementById('colorSelect');
        sel.options[0] = new Option('yellow');
        sel.options[1] = new Option('blue');
        sel.options[2] = new Option('dark');
    },
    

    // set theme
    darkTheme : function(sel)
    {
        if ( sel.value == '1' )
        {
            document.body.style.backgroundColor = 'var(--ui-bgColor, white)';
            document.body.style.color = 'var(--ui-color, black)';
        }
        else
        {
            document.body.style.backgroundColor = 'white';
            document.body.style.color = 'black';
        }
    },
    

    // output
    output: function(lib)
    {
        document.getElementById('output').innerHTML = lib;
    }
    
};



// autoload
nettools.jscore.registerOnLoadCallback(sample.writeColorSelection);
