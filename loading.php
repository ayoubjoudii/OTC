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

    .logo {
        width: 60%;
        transition: all 1.5s ease;
        position: absolute;
        top: 60%;
        transform: translate(-50%, -50%);
        left: 50%;
        
    }

    .move-down {
        top: 90%;          /* move near bottom */
        transform: translate(-50%, -50%) scale(0.5);
         /* shrink */
    }
    .fade-out {
        opacity: 0;
        pointer-events: none;
    }
</style>
</head>

<body>
<div class="loading-screen" id="loading-screen" >
<img src="logo.png" class="logo" id="logo">
</div>
<script>
    const loadingScreen = document.getElementById("loading-screen");
    // Wait 1 second then animate
    setTimeout(() => {
        document.getElementById("logo").classList.add("move-down");
    }, 1000);
     setTimeout(() => {
        loadingScreen.classList.add("fade-out");
    }, 2500);
</script>

</body>
</html>









