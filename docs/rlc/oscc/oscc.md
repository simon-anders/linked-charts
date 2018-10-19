## R/LinkedCharts Tutorial
# Augmenting and checking a standard RNA-Seq analysis

In this simple tutorial, we show how to explore a standard RNA-Seq analysis.

## The data

We are working with data from this paper:

| C. Conway et al.: *Elucidating drivers of oral epithelial dysplasia formation and malignant transformation to cancer using RNAseq*. Oncotarget, 6:40186-40201 (2015), [doi:10.18632/oncotarget.5529](https://doi.org/10.18632/oncotarget.5529)

Conweay et al. have collected tissue samples from 19 patients with oral squamous
cell carcinoma (OSCC). From each patient, they took 3 samples, one of normal oral mucosa, 
one of epithelial dysplasia (i.e., abnormal but not yet malignant tissue, 
and one sample of the tumour ("T"). We will use their data (available from the European
Read Archive (ERA) under accession [PRJEB7455](https://www.ebi.ac.uk/ena/data/view/PRJEB7455))
to demonstrate how LinkedCharts can be helpful in a standard bioinformatics task like
analysing an RNA-Seq data set.

Fortunately, we do not have to redo the whole abalysis, as the Recount2 project 
(Collado Torres et al., Nature Biotechnology, 2017, [doi:10.1038/nbt.3838](https://doi.org/10.1038/nbt.3838)) 
gives us a headstart by providing a count table for this and other data sets.

Nevertheless, a bit of data wrangling is necessary, and in order to keep this tutorial short,
we describe these preparatory steps in an [appendix](data_prep.md). 

We hence start by loading the data file resulting from the preparations, which is 
available here: [oscc.rda](oscc.rda)


```r
load( "oscc.rda" )
```

We have data for 57 samples (19 patients x 3 tissue samples per patient), with the metadata in `sampleTable`:


```r
sampleTable
```

```
##    run_accession sample_name patient    tissue
## 1      ERR649059     PG004-N   PG004    normal
## 2      ERR649060     PG004-D   PG004 dysplasia
## 3      ERR649061     PG004-T   PG004    tumour
## 4      ERR649035     PG038-N   PG038    normal
## 5      ERR649018     PG038-D   PG038 dysplasia
## 6      ERR649025     PG038-T   PG038    tumour
## 7      ERR649022     PG049-N   PG049    normal
## 8      ERR649021     PG049-D   PG049 dysplasia
## 9      ERR649020     PG049-T   PG049    tumour
## 10     ERR649026     PG063-N   PG063    normal
## 11     ERR649023     PG063-D   PG063 dysplasia
## 12     ERR649024     PG063-T   PG063    tumour
## 13     ERR649062     PG079-N   PG079    normal
## 14     ERR649064     PG079-D   PG079 dysplasia
## 15     ERR649065     PG079-T   PG079    tumour
## 16     ERR649034     PG086-N   PG086    normal
## 17     ERR649037     PG086-D   PG086 dysplasia
## 18     ERR649036     PG086-T   PG086    tumour
## 19     ERR649053     PG105-N   PG105    normal
## 20     ERR649063     PG105-D   PG105 dysplasia
## 21     ERR649045     PG105-T   PG105    tumour
## 22     ERR649029     PG108-N   PG108    normal
## 23     ERR649028     PG108-D   PG108 dysplasia
## 24     ERR649027     PG108-T   PG108    tumour
## 25     ERR649072     PG114-N   PG114    normal
## 26     ERR649073     PG114-D   PG114 dysplasia
## 27     ERR649074     PG114-T   PG114    tumour
## 28     ERR649069     PG122-N   PG122    normal
## 29     ERR649070     PG122-D   PG122 dysplasia
## 30     ERR649071     PG122-T   PG122    tumour
## 31     ERR649043     PG123-N   PG123    normal
## 32     ERR649033     PG123-D   PG123 dysplasia
## 33     ERR649044     PG123-T   PG123    tumour
## 34     ERR649030     PG129-N   PG129    normal
## 35     ERR649031     PG129-D   PG129 dysplasia
## 36     ERR649032     PG129-T   PG129    tumour
## 37     ERR649019     PG136-N   PG136    normal
## 38     ERR649041     PG136-D   PG136 dysplasia
## 39     ERR649042     PG136-T   PG136    tumour
## 40     ERR649038     PG137-N   PG137    normal
## 41     ERR649039     PG137-D   PG137 dysplasia
## 42     ERR649040     PG137-T   PG137    tumour
## 43     ERR649046     PG144-N   PG144    normal
## 44     ERR649047     PG144-D   PG144 dysplasia
## 45     ERR649048     PG144-T   PG144    tumour
## 46     ERR649049     PG146-N   PG146    normal
## 47     ERR649050     PG146-D   PG146 dysplasia
## 48     ERR649051     PG146-T   PG146    tumour
## 49     ERR649052     PG174-N   PG174    normal
## 50     ERR649055     PG174-D   PG174 dysplasia
## 51     ERR649054     PG174-T   PG174    tumour
## 52     ERR649058     PG187-N   PG187    normal
## 53     ERR649057     PG187-D   PG187 dysplasia
## 54     ERR649056     PG187-T   PG187    tumour
## 55     ERR649066     PG192-N   PG192    normal
## 56     ERR649067     PG192-D   PG192 dysplasia
## 57     ERR649068     PG192-T   PG192    tumour
```

Our actual data is a matrix of read counts: The samples are the columns, the rows the genes, the matrix entries the
number of RNA-Seq reads that mapped to each gene in each sample. Here is the top left corner of `countMatrix`:


```r
countMatrix[ 1:5, 1:5 ]
```

```
##          PG004-N PG004-D PG004-T PG038-N PG038-D
## TSPAN6     11642   25423    1526   37354   30699
## TNMD         405       0    1628     371       0
## DPM1       21828   32694     973   55566   33814
## SCYL3      31332   38436   11661   77985   63853
## C1orf112   14207   21808    8047   25159   25862
```

## An interactive heatmap for quality assessment

When starting to work with such data, it is usually a good idea to first assess the quality of the data. It is unlikely
that all of these many samples are of equally perfect quality. A good way to check is to calculate the correlation or distance between
all pairs of samples. We use Spearman correlation so that we don not have to worry (yet) about how to normalize and transform
the data.


```r
corrMat <- cor( countMatrix, method="spearman" )
corrMat[1:5,1:5]
```

```
##           PG004-N   PG004-D   PG004-T   PG038-N   PG038-D
## PG004-N 1.0000000 0.8927562 0.7745358 0.8963811 0.8948413
## PG004-D 0.8927562 1.0000000 0.7775693 0.9026254 0.9015365
## PG004-T 0.7745358 0.7775693 1.0000000 0.7569003 0.7538902
## PG038-N 0.8963811 0.9026254 0.7569003 1.0000000 0.9363055
## PG038-D 0.8948413 0.9015365 0.7538902 0.9363055 1.0000000
```

We visualize this matrix as a heatmap (using Raivo Kolde's `pheatmap` package)


```r
rownames(sampleTable) <- sampleTable$sample_name  # pheatmap insists on that
pheatmap::pheatmap( corrMat,
   cluster_rows=FALSE, cluster_cols=FALSE,
   annotation_col = sampleTable[,c("patient","tissue")] )
```

![plot of chunk heatmap](figure/heatmap-1.png)

We can see that most samples pairs correlate well with each other, with correlation coefficients
above ~0.85, in the yellow-orange colour range. Same samples, however, show consitently poorer
correlation with all other samples. But is 0.8 really a good cut point, or is this just what the 
arbitrary color scale happens to highlight?

Each square in this heatmap summerizes a scatter plot. For example, the square between relating
to the first two samples, PG004-N and PG004-D, is the Spearman correlation associated with this plot:


```r
plot( 
   log10( 1 + countMatrix[,"PG004-N"] ), 
   log10( 1 + countMatrix[,"PG004-D"] ), 
   asp=1, col=adjustcolor("black",0.2), pch=20, cex=.5 )
```

![plot of chunk scatter](figure/scatter-1.png)

We have plotted here logarithms of the count values, $\log_{10}(k+1)$, with one pseudocount added to avoid zeroes, 
which cannot be shown in a log-log plot, because $\log 0 = -\infty$.

If we looked at several such plots for different squares in the heatmap, maybe some orange ones, a few yellow ones, and
some of the blueish ones, we could get a quick feeling about how good or bad a correlation value of 0.9 or 0.8 is.

With LinkedChart, we can do precisely that. We can display the two plots side-by-side, and when one clicks with the mouse 
on a square on the heatmap, the scatter plot will change to display the correlation between the two samples associated with 
the heatmap square.

Here is first the code to display the two plots side-by-side, for now without linking them (i.e., without handling mouse clicks):


```r
library( rlc )

openPage( useViewer=FALSE, layout="table1x2" )
```

```
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/JsRCom/http_root/index.html"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/JsRCom//http_root/JsRCom.js"
## [1] "WebSocket opened"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/linked-charts.css"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/rlc.js"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/linked-charts.min.js"
```

```r
lc_heatmap(
   dat(
      value = corrMat
   ),
   place = "A1"
)
```

```
## [1] "main"
```

```
## The following `from` values were not present in `x`: labels, color, colorValue, colourValues, colorValues, colorDomain, colorLegendTitle, addColorScaleToLegend, symbols, symbolValues, strokes, values, heatmapRows, heatmapCols, showValues
```

```r
sampleX <- "PG004-N"
sampleY <- "PG004-D"

lc_scatter(
   dat(
      x = log10( 1 + countMatrix[,sampleX] ),
      y = log10( 1 + countMatrix[,sampleY] ),
      size = .3,
      alpha = .3
   ),
   place = "A2"
)
```

```
## [1] "main"
## [1] "Layer1"
```

```
## The following `from` values were not present in `x`: labels, color, colorValue, colourValues, colorValues, colorDomain, colorLegendTitle, addColorScaleToLegend, symbols, symbolValues, strokes, values, heatmapRows, heatmapCols, showValues
```

To run this code, you first need to install R/LinkedChart. If you haven't done so yet, see the simple instructions on 
the [overview page](..). 

Once you run the code, you should see, in your web browser, a picture like this. (Give the scatter plot a few seconds to appear; it has nearly 60,000 points.) Note how sample names and gene names are displayed when you hover your mouse over a square or point. You can also zoom in (draw a rectangle with the mouse) or out (double-click) or use other functions in the tool menu (click on the arrow button).

![](heatmap_scatter.png)

We go through this code now and explain line for line:

First, we load the R/LinkedChart package ("`rlc`"). Then, we use `openPage` to open a new page. We can open the page 
either in the web browser (`useViewer=FALSE`) or in the viewer pane of RStudio (`useViewer=TRUE`, the default). As
we have two plots, we opt for a layout with 1 row and 2 columns (`layout="table1x2"`). 

Next, we insert the first chart, teh heatmap, using the `lc_heatmap` fucntion. All charts in R/LinkedChart are placed
with functions starting with `lc_`, and they all want a first argument that sets all their data and that has to be enclosed
in `dat(...)` (which we will explain later). For a heatmap, we just need a matrix, which has to be assigned (in the `dat` phrase)
to `value`. The second argument is the `place` where the chart should be put. In our `table1x2` layout, the places are 
labelled `A1` and `A2`. (If we had, say, a `table2x2` layout, there would also be `B1` and `B2` for the second row.)

Now, we set two global variables, `sampleX` and `sampleY`, to the names of the two samples that we want to initially
display in the scatter plot.

The scatter plot is inserted with `lc_scatter`. Again, its first argument must be enclosed in `dat(...)`. Within the `dat`, we 
set four properties: `x`, `y`, `size` and `alpha`. The first two are mandatory: They are vectors with the values of the x
and y coordinates. As before, when using R's standard `plot` function, we use `log10( 1 + countMatrix[,sample])`. 

The other two properties are optional: We set `size = .3` to make the points a bit smaller than the default, and we make 
them somewhat transparent, by reducing the opacity, `alpha`, so that one can see whether several points sit on top of each other 
(similar to the use of `adjustcolor` above). We place the chart at position `A2`, to the right of the heatmap at `A1`.

Next, we need to "link" the charts. For this, we just add four very simple lines, marked below with hashes (#):



```r
library( rlc )

openPage( useViewer=FALSE, layout="table1x2" )
```

```
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/JsRCom/http_root/index.html"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/JsRCom//http_root/JsRCom.js"
## [1] "WebSocket opened"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/linked-charts.css"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/rlc.js"
## [1] "Reading /home/anders/R/x86_64-pc-linux-gnu-library/3.4/rlc//http_root/linked-charts.min.js"
```

```r
sampleX <- "PG004-N"
sampleY <- "PG004-D"

lc_heatmap(
   dat(
      value = corrMat,
      on_click = function(k) {     #  \  
         sampleX <<- k[1]          #  |  Linking the
         sampleY <<- k[2]          #  |  charts
         updateChart( "A2" )       #  /
      }
   ),
   place = "A1"
)
```

```
## [1] "main"
```

```
## The following `from` values were not present in `x`: labels, color, colorValue, colourValues, colorValues, colorDomain, colorLegendTitle, addColorScaleToLegend, symbols, symbolValues, strokes, values, heatmapRows, heatmapCols, showValues
```

```r
countMatrix_downsampled <- 
   countMatrix[ sample.int( nrow(countMatrix), 8000 ), ]

lc_scatter(
   dat(
      x = log10( 1 + countMatrix_downsampled[,sampleX] ),
      y = log10( 1 + countMatrix_downsampled[,sampleY] ),
      size = .3,
      alpha = .3
   ),
   place = "A2"
)
```

```
## [1] "main"
## [1] "Layer1"
```

```
## The following `from` values were not present in `x`: labels, color, colorValue, colourValues, colorValues, colorDomain, colorLegendTitle, addColorScaleToLegend, symbols, symbolValues, strokes, values, heatmapRows, heatmapCols, showValues
```

We have added a second property to the heatmap, inside the `dat`. The property `on_click` tells LinkedCharts what to
do when the user clicks on a square in the heatmap. It is a function with one argument, `k`, which R/LinkedChart will
call whenever a mouse-click event happens in the heatmap, and R/LinkedChart will then place in `k` the row and column 
indices of the square that was clicked.

Our `on_click` function just does two things: First, it stores the row and column indices (passed as `k[1]` and `k[2]`) in
`sampleX` and `sampleY`, the two global variables that we used to indicate which samples the scatter plot should show. Now, they
indicate that the scatter plot should show the samples corresponding to the square that has just been clicked. We only need to tell
the scatter plot that its data has changes and that it should redraw itself. Hence, the call to `updateChart`, which causes
the indicated chart (here the one at `A2`) to be redrawn.

Now we can also see why the property assignments have to be enclosed into `dat`: `dat` is a construct that keeps the code it 
encloses in an unevaluated form, so that it can be re-evaluated over and over as needed. And here, the code in the scatter plots
`dat`, e.g., `x = log10( 1 + countMatrix_downsampled[,sampleX] )`, will get a different result whenever `sampleX` has changed.

This is the general idea of LinkedCharts: You describe, with the `dat` properties, how your plot should look like, using global 
variables, which you can change, e.g., when the user clicks somewhere, and the cause the plot to be redrawn. This makes is extremely easy to link charts in the manner just shown.

One subtelty: Because the `on_click` fucntion needs to set a global variable, we have used in it the special global 
assignment operator `<<-` instead of the usual `<-` or `=`. It is important not to foget to use `<<-` as otherwise, R would
create a local variable `sampleX` and discard it immediatly instead of changing the global variable that also the other chart 
can see.

And for completeness: There is a second change in the plot above: We have downsampled the count matrix from 58,000 genes to just 8,000
genes. This is merely to ensure that the app reacts smoothly to mouse clicks also on less powerful computers. It shouldn't change the appearance of the plots much.


If you use the app, you can now easily see which samples are bad and how bad they are. For example, you will notice that they seem to have especially strong noise for the weaker genes.


## Exploring the differentially expressed genes

[...]