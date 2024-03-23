---
layout: post
title: Integrated Understanding of Calculus Symbols
date: 2024-03-23 17:00:00+0900
description: CAL1-PREVIEW-1
thumbnail: assets/img/9.jpg
---

# Integrated Understanding of Calculus Symbols

### Version
* 2024.03.23. Version 0.1

*Written for personal understanding, it may lack some mathematical rigor.*
<hr/>

### Differentiation of vector functions and tensor functions

##### Preview
1. Dependent Variable vs Independent Variable in Function
```
 When observing a function in isolation
 independent variable := input values
 dependent variable := output values 
```
$$\frac{d}{dt}F(t, q(t), q'(t))  = \frac { \partial F } { \partial t } \frac { d t } { d t } + \frac { \partial F } { \partial q } \frac { d q } { d t } + \frac { \partial f } { \partial q } \frac { d q } { d t }$$

In the above differentiation, **it can be argued that t, q(t), and q'(t) are not independent.** However, when performing partial differentiation of F, **we assume that they are independent.**
In other words, the meaning of $\frac{\partial F}{\partial q}$ is simply to perform partial differentiation of function F with respect to the second argument and then substitute t, q(t), and q'(t) into the argument. . (according to the naming given initially)

2. Generalization of Scalar, Vector, Matrix into Tensor

```
 Scalar = Rank 0-Tensor
 Vector = Rank 1-Tensor
 Matrix = Rank 2-Tensor
 ```

![enter image description here](https://dl.dropbox.com/scl/fi/lr5c9iej1w4yhy3lfrdso/2024-03-23-14.58.06.webp?rlkey=a8ezxt81ct4rank5nz905xb6b)


3. Splitting Higher Rank Tensor Function into Lower Rank Tensor function

*Higher Rank Tensor Function is a combination of Lower Rank Tensor Function.*
$$\R^2\rightarrow \R^2 \text{ function } f(x_1, x_2) = (y_1, y_2) \\
\R^2\rightarrow\R \text{ function } f_1(x_1, x_2) = y_1 \text{, } f_2(x_1, x_2) = y_2 $$
In the example above, $f$ is a combination of $f_1$ and $f_2$, and like this, the function can be expressed as a combination of lower-dimensional functions.
This suggests that **calculus operations for arbitrary functions** (such as vector fields) **can be easily defined as long as calculus operations for scalar functions are well defined**.
```
XX Function = Function with output value type XX
 type of input value does not matter.
 
 example)
 f:R->R : Scalar Function
 f:R^n->R : Scalar Function
 f:R->R^2 : Vector Function (a.k.a. Vector Field)
 f:R^n->R^m : Vector Function
 f:R^2-> R^2 x R^3 : Matrix Function
 f:R^3 x R^3 -> R^3 x R^3 x R^3 : Rank 3-Tensor Function
```
4. Defining Partial Differentiation of Vector-to-Scalar Function
$$\text{for } \R^m\rightarrow \R \text{ function }f_k(x_1, x_2, \dots,x_m) = y_k \\
\frac{\partial f_k}{\partial x_t } := \lim_{h\rightarrow 0}{\frac{f_k(x_1, x_2, \dots, x_t+h,\dots,x_m) - f_k}{h}}$$

5. Operator and Infinite Dimensional Vector Space (from Functional Analysis)

##### Defining Total Differentiation
1. Total Differentiation of Scalar-to-Vector Function
	```
		// Total Differential Operator (for multivariable function)
		input  : Scalar-to-Vector Function
		output : Vector-to-Vector Function
		=> operation result : Vector
	```
	$$\text{for } \R\rightarrow \R^n \text{ function }f(x) = (y_1, y_2, \dots,y_n) \\
\text{total differentiation }f'(x) :=(\frac{dy_1}{dx},\frac{dy_2}{dx},\dots,\frac{dy_n}{dx})$$
This is the combination of $f'_k(x) = \frac{dy_k}{dx}$, which is the derivative of the Scalar-to-Scalar Function $f_k(x) = y_k$.

2. Jacobian : Total Differential Operator of Vector-to-Vector Function
	$$\text{for } \R^n\rightarrow \R^m \text{ function }f(x_1, x_2, \dots,x_n) = (y_1, y_2, \dots,y_m) \\
\text{total differentiation } J[f]
\stackrel{notation}{=} f'(x)
\stackrel{notation}{=} \frac { \partial ( y _ { 1 } , y _ { 2 } \dots y _ { n } ) } { \partial ( x _ { 1 } , x _ { 2 } - x _ { m } ) }
\\:=\left( \begin{array}{c} f_1'(X) \\ f_2'(X) \\ \vdots \\ f_m'(X) \end{array} \right)
\\\text{where }\left\{ \begin{array}{ll} \text{vector } X = (x_1, x_2, \dots, x_n) \\ \R^n\rightarrow\R \text{ function } f_k(X) = y_k \end{array} \right.
$$
 

3. Hessian : Second Total Differential Operator of Vector-to-Vector Function
4. Further Total Differentiation of Vector-to-Vector Function

##### Defining Operators related to Navla symbols
1. Gradient Operator (Navla Operator)
	```
		// Gradient Operator
		input  : Vector-to-Scalar Function
		output : Vector-to-Vector Function
		=> operation result : Vector
	```
2.  Divergence Operator
	```
		//Divergence Operator
		input  : Vector-to-Vector Function
		output : Vector-to-Scalar Function
		=> operation result : Scalar
	```
3. Curl Operator
	```
		//Curl Operator
		input  : Vector-to-Vector Function
		output : Vector-to-Scalar Function
		=> result : Scalar
	```
4. Laplacian Operator
	```
		//Laplacian Operator
		input  : Vector-to-Vector Function
		output : Vector-to-Scalar Function
		=> result : Vector-to-Scalar Function
	```
##### Differentiation of Tensor Function (To be written later)

