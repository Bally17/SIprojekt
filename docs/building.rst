Building the Docs
=================

From the project root:

.. code-block:: bash

   sphinx-build -b html docs docs/_build/html
   sphinx-build -b latex docs docs/_build/latex
   make -C docs/_build/latex latexpdf

From the docs directory:

.. code-block:: bash

   sphinx-build -b html . _build/html
   sphinx-build -b latex . _build/latex
   make -C _build/latex latexpdf
