<?php?>


<style>
    #loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;

        background: #000000ff;
        display: flex;
        justify-content: center;
        align-items: center;

        transition: opacity 1s ease;
        z-index: 9999;
    }

    .welcome {
        width: 60%;
        font-family: cursive serif;
        transition: opacity 1.5s ease;
        position: absolute;
        top: 50%;
        color: white;
        left: 50%;

    }

    
    .fade-out {
        opacity: 0;
        pointer-events: none;
    }
</style>
</head>

<body>
<div class="loading-screen" id="loading-screen" >
<p id="welcome" class="welcome" >Welcome!</p>
</div>
<script>
    const loadingScreen = document.getElementById("loading-screen");
    // Wait 1 second then animate
    setTimeout(() => {
        document.getElementById("welcome").classList.add("fade-out");
    }, 1000);
     setTimeout(() => {
        loadingScreen.classList.add("fade-out");
    }, 2500);
</script>

</body>
</html>