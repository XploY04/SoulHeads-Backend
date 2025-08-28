# 📱 SoulHeads Flutter Integration Guide

Complete guide for integrating your SoulHeads backend with a Flutter mobile application.

## 🏗️ Backend Overview

**SoulHeads Backend Stack:**

- **Framework**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: Firebase Authentication
- **File Storage**: Cloudinary
- **API Style**: RESTful API
- **Image Uploads**: Multipart form data

**Base URL**: `http://your-server-url:5000/api`

## 🚀 Flutter Setup

### 1. Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # HTTP client
  http: ^1.1.0
  dio: ^5.3.2 # Alternative HTTP client with better file upload support

  # Firebase
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3

  # State Management
  provider: ^6.1.1 # or bloc, riverpod, get, etc.

  # Image handling
  image_picker: ^1.0.4
  cached_network_image: ^3.3.0

  # Storage
  shared_preferences: ^2.2.2

  # UI
  flutter_spinkit: ^5.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

### 2. Project Structure

```
lib/
├── main.dart
├── models/
│   ├── user_model.dart
│   ├── post_model.dart
│   └── sneaker_model.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── post_service.dart
│   └── user_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── post_provider.dart
│   └── user_provider.dart
├── screens/
│   ├── auth/
│   ├── home/
│   ├── profile/
│   └── posts/
├── widgets/
└── utils/
    ├── constants.dart
    └── api_endpoints.dart
```

## 🔧 Configuration

### 1. API Constants

Create `lib/utils/constants.dart`:

```dart
class ApiConstants {
  // Update this with your actual server URL
  static const String baseUrl = 'http://10.0.2.2:5000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:5000/api'; // iOS simulator
  // static const String baseUrl = 'https://your-domain.com/api'; // Production

  // Endpoints
  static const String auth = '/auth';
  static const String users = '/users';
  static const String posts = '/posts';
  static const String sneakers = '/sneakers';
  static const String dev = '/dev'; // Development only

  // Headers
  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Development headers (remove in production)
  static const Map<String, String> devHeaders = {
    'x-dev-bypass': 'true',
    'x-dev-username': 'flutter_user',
  };
}
```

### 2. API Endpoints

Create `lib/utils/api_endpoints.dart`:

```dart
import 'constants.dart';

class ApiEndpoints {
  // Authentication
  static const String register = '${ApiConstants.baseUrl}${ApiConstants.auth}/register';
  static const String login = '${ApiConstants.baseUrl}${ApiConstants.auth}/login';
  static const String profile = '${ApiConstants.baseUrl}${ApiConstants.auth}/profile';
  static const String uploadProfilePhoto = '${ApiConstants.baseUrl}${ApiConstants.auth}/profile/photo';

  // Users
  static String getUserByUsername(String username) =>
      '${ApiConstants.baseUrl}${ApiConstants.users}/$username';
  static String followUser(String userId) =>
      '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/follow';
  static String unfollowUser(String userId) =>
      '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/unfollow';
  static String getUserFollowers(String userId) =>
      '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/followers';
  static String getUserFollowing(String userId) =>
      '${ApiConstants.baseUrl}${ApiConstants.users}/$userId/following';

  // Posts
  static const String createPost = '${ApiConstants.baseUrl}${ApiConstants.posts}';
  static const String getAllPosts = '${ApiConstants.baseUrl}${ApiConstants.posts}';
  static const String getFollowingPosts = '${ApiConstants.baseUrl}${ApiConstants.posts}/following';
  static String getPost(String postId) =>
      '${ApiConstants.baseUrl}${ApiConstants.posts}/$postId';
  static String updatePost(String postId) =>
      '${ApiConstants.baseUrl}${ApiConstants.posts}/$postId';
  static String deletePost(String postId) =>
      '${ApiConstants.baseUrl}${ApiConstants.posts}/$postId';
  static String likePost(String postId) =>
      '${ApiConstants.baseUrl}${ApiConstants.posts}/$postId/like';
  static String getUserPosts(String userId) =>
      '${ApiConstants.baseUrl}${ApiConstants.posts}/user/$userId';

  // Sneakers
  static const String getAllSneakers = '${ApiConstants.baseUrl}${ApiConstants.sneakers}';
  static const String getTopSneakers = '${ApiConstants.baseUrl}${ApiConstants.sneakers}/top';
  static String getSneaker(String sneakerId) =>
      '${ApiConstants.baseUrl}${ApiConstants.sneakers}/$sneakerId';
  static String rateSneaker(String sneakerId) =>
      '${ApiConstants.baseUrl}${ApiConstants.sneakers}/$sneakerId/rate';
  static String searchSneakers(String query) =>
      '${ApiConstants.baseUrl}${ApiConstants.sneakers}/search/$query';
  static String getSneakersByBrand(String brand) =>
      '${ApiConstants.baseUrl}${ApiConstants.sneakers}/brand/$brand';

  // Development (remove in production)
  static const String createTestUser = '${ApiConstants.baseUrl}${ApiConstants.dev}/create-user';
  static const String listUsers = '${ApiConstants.baseUrl}${ApiConstants.dev}/users';
  static const String mockLogin = '${ApiConstants.baseUrl}${ApiConstants.dev}/mock-login';
}
```

## 🔐 Firebase Setup

### 1. Firebase Configuration

Create `lib/services/firebase_service.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirebaseService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  // Initialize Firebase
  static Future<void> initializeFirebase() async {
    await Firebase.initializeApp();
  }

  // Get current user
  static User? getCurrentUser() {
    return _auth.currentUser;
  }

  // Get Firebase ID Token
  static Future<String?> getIdToken() async {
    final user = getCurrentUser();
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  // Sign in with email and password
  static Future<UserCredential?> signInWithEmailPassword(
    String email,
    String password
  ) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email,
        password: password
      );
    } catch (e) {
      print('Firebase Auth Error: $e');
      rethrow;
    }
  }

  // Register with email and password
  static Future<UserCredential?> registerWithEmailPassword(
    String email,
    String password
  ) async {
    try {
      return await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password
      );
    } catch (e) {
      print('Firebase Registration Error: $e');
      rethrow;
    }
  }

  // Sign out
  static Future<void> signOut() async {
    await _auth.signOut();
  }

  // Auth state changes stream
  static Stream<User?> authStateChanges() {
    return _auth.authStateChanges();
  }
}
```

## 🌐 API Service

### 1. Base API Service

Create `lib/services/api_service.dart`:

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:dio/dio.dart';
import '../utils/constants.dart';
import 'firebase_service.dart';

class ApiService {
  static final Dio _dio = Dio();

  // Get headers with Firebase token
  static Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    Map<String, String> headers = Map.from(ApiConstants.headers);

    // Add development headers (remove in production)
    headers.addAll(ApiConstants.devHeaders);

    if (includeAuth) {
      final token = await FirebaseService.getIdToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // GET request
  static Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? queryParams,
    bool requireAuth = false,
  }) async {
    try {
      final headers = await _getHeaders(includeAuth: requireAuth);

      Uri uri = Uri.parse(endpoint);
      if (queryParams != null) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http.get(uri, headers: headers);

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // POST request
  static Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> body, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = await _getHeaders(includeAuth: requireAuth);

      final response = await http.post(
        Uri.parse(endpoint),
        headers: headers,
        body: jsonEncode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // PUT request
  static Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> body, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = await _getHeaders(includeAuth: requireAuth);

      final response = await http.put(
        Uri.parse(endpoint),
        headers: headers,
        body: jsonEncode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE request
  static Future<Map<String, dynamic>> delete(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = await _getHeaders(includeAuth: requireAuth);

      final response = await http.delete(
        Uri.parse(endpoint),
        headers: headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Upload file with Dio
  static Future<Map<String, dynamic>> uploadFile(
    String endpoint,
    File file,
    String fieldName, {
    Map<String, dynamic>? additionalFields,
    bool requireAuth = true,
  }) async {
    try {
      final headers = await _getHeaders(includeAuth: requireAuth);

      _dio.options.headers.addAll(headers);

      FormData formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
        ...?additionalFields,
      });

      final response = await _dio.post(endpoint, data: formData);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data;
      } else {
        throw Exception('Upload failed: ${response.statusMessage}');
      }
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Handle HTTP response
  static Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      final errorBody = jsonDecode(response.body);
      throw ApiException(
        message: errorBody['message'] ?? 'Unknown error occurred',
        statusCode: response.statusCode,
      );
    }
  }

  // Handle errors
  static Exception _handleError(dynamic error) {
    if (error is SocketException) {
      return ApiException(message: 'No internet connection', statusCode: 0);
    } else if (error is ApiException) {
      return error;
    } else {
      return ApiException(message: error.toString(), statusCode: 500);
    }
  }
}

// Custom API Exception
class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}
```

## 📝 Data Models

### 1. User Model

Create `lib/models/user_model.dart`:

```dart
class UserModel {
  final String id;
  final String username;
  final String email;
  final String profilePhoto;
  final int totalSneakerCount;
  final int followers;
  final int following;
  final int? postCount;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.profilePhoto,
    required this.totalSneakerCount,
    required this.followers,
    required this.following,
    this.postCount,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      profilePhoto: json['profilePhoto'] ?? '',
      totalSneakerCount: json['totalSneakerCount'] ?? 0,
      followers: json['followers'] is List
          ? (json['followers'] as List).length
          : json['followers'] ?? 0,
      following: json['following'] is List
          ? (json['following'] as List).length
          : json['following'] ?? 0,
      postCount: json['postCount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'profilePhoto': profilePhoto,
      'totalSneakerCount': totalSneakerCount,
      'followers': followers,
      'following': following,
      'postCount': postCount,
    };
  }
}
```

### 2. Post Model

Create `lib/models/post_model.dart`:

```dart
class PostModel {
  final String id;
  final String userId;
  final String? sneakerId;
  final String mainImage;
  final List<String> additionalImages;
  final String brandName;
  final String sneakerName;
  final String description;
  final String? purchaseLink;
  final String? purchaseAddress;
  final double? price;
  final int? year;
  final List<String> likes;
  final DateTime createdAt;
  final UserModel? user;
  final SneakerModel? sneaker;

  PostModel({
    required this.id,
    required this.userId,
    this.sneakerId,
    required this.mainImage,
    required this.additionalImages,
    required this.brandName,
    required this.sneakerName,
    required this.description,
    this.purchaseLink,
    this.purchaseAddress,
    this.price,
    this.year,
    required this.likes,
    required this.createdAt,
    this.user,
    this.sneaker,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      sneakerId: json['sneakerId'],
      mainImage: json['mainImage'] ?? '',
      additionalImages: List<String>.from(json['additionalImages'] ?? []),
      brandName: json['brandName'] ?? '',
      sneakerName: json['sneakerName'] ?? '',
      description: json['description'] ?? '',
      purchaseLink: json['purchaseLink'],
      purchaseAddress: json['purchaseAddress'],
      price: json['price']?.toDouble(),
      year: json['year'],
      likes: List<String>.from(json['likes'] ?? []),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      user: json['user'] != null ? UserModel.fromJson(json['user']) : null,
      sneaker: json['sneaker'] != null ? SneakerModel.fromJson(json['sneaker']) : null,
    );
  }

  int get likeCount => likes.length;

  bool isLikedBy(String userId) => likes.contains(userId);
}

class SneakerModel {
  final String id;
  final String sneakerName;
  final String brandName;
  final double averageRating;
  final int ratingCount;
  final int postCount;

  SneakerModel({
    required this.id,
    required this.sneakerName,
    required this.brandName,
    required this.averageRating,
    required this.ratingCount,
    required this.postCount,
  });

  factory SneakerModel.fromJson(Map<String, dynamic> json) {
    return SneakerModel(
      id: json['_id'] ?? json['id'] ?? '',
      sneakerName: json['sneakerName'] ?? '',
      brandName: json['brandName'] ?? '',
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      ratingCount: json['ratingCount'] ?? 0,
      postCount: json['postCount'] ?? 0,
    );
  }
}
```

## 🔄 Services Layer

### 1. Authentication Service

Create `lib/services/auth_service.dart`:

```dart
import '../models/user_model.dart';
import '../utils/api_endpoints.dart';
import 'api_service.dart';
import 'firebase_service.dart';

class AuthService {
  // Register user
  static Future<UserModel> register({
    required String email,
    required String password,
    required String username,
  }) async {
    try {
      // First register with Firebase
      final credential = await FirebaseService.registerWithEmailPassword(email, password);

      if (credential?.user == null) {
        throw Exception('Firebase registration failed');
      }

      // Get Firebase ID token
      final idToken = await credential!.user!.getIdToken();

      // Register with backend
      final response = await ApiService.post(
        ApiEndpoints.register,
        {
          'idToken': idToken,
          'username': username,
          'email': email,
        },
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  // Login user
  static Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      // First authenticate with Firebase
      final credential = await FirebaseService.signInWithEmailPassword(email, password);

      if (credential?.user == null) {
        throw Exception('Firebase login failed');
      }

      // Get Firebase ID token
      final idToken = await credential!.user!.getIdToken();

      // Login with backend
      final response = await ApiService.post(
        ApiEndpoints.login,
        {
          'idToken': idToken,
        },
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }

  // Get current user profile
  static Future<UserModel> getProfile() async {
    try {
      final response = await ApiService.get(
        ApiEndpoints.profile,
        requireAuth: true,
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Failed to get profile: $e');
    }
  }

  // Update profile
  static Future<UserModel> updateProfile({
    required String username,
  }) async {
    try {
      final response = await ApiService.put(
        ApiEndpoints.profile,
        {
          'username': username,
        },
        requireAuth: true,
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  // Upload profile photo
  static Future<UserModel> uploadProfilePhoto(File imageFile) async {
    try {
      final response = await ApiService.uploadFile(
        ApiEndpoints.uploadProfilePhoto,
        imageFile,
        'profilePhoto',
        requireAuth: true,
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Failed to upload profile photo: $e');
    }
  }

  // Development login (remove in production)
  static Future<UserModel> mockLogin({
    required String username,
  }) async {
    try {
      final response = await ApiService.post(
        ApiEndpoints.mockLogin,
        {
          'username': username,
        },
      );

      return UserModel.fromJson(response['user']);
    } catch (e) {
      throw Exception('Mock login failed: $e');
    }
  }

  // Logout
  static Future<void> logout() async {
    await FirebaseService.signOut();
  }
}
```

### 2. Post Service

Create `lib/services/post_service.dart`:

```dart
import 'dart:io';
import '../models/post_model.dart';
import '../utils/api_endpoints.dart';
import 'api_service.dart';

class PostService {
  // Create post
  static Future<PostModel> createPost({
    required File mainImage,
    List<File>? additionalImages,
    required String brandName,
    required String sneakerName,
    required String description,
    String? purchaseLink,
    String? purchaseAddress,
    double? price,
    int? year,
  }) async {
    try {
      Map<String, dynamic> fields = {
        'brandName': brandName,
        'sneakerName': sneakerName,
        'description': description,
      };

      if (purchaseLink != null) fields['purchaseLink'] = purchaseLink;
      if (purchaseAddress != null) fields['purchaseAddress'] = purchaseAddress;
      if (price != null) fields['price'] = price.toString();
      if (year != null) fields['year'] = year.toString();

      // For multiple files, you'll need to use Dio with multiple MultipartFile
      final response = await ApiService.uploadFile(
        ApiEndpoints.createPost,
        mainImage,
        'mainImage',
        additionalFields: fields,
        requireAuth: true,
      );

      return PostModel.fromJson(response['post']);
    } catch (e) {
      throw Exception('Failed to create post: $e');
    }
  }

  // Get all posts
  static Future<List<PostModel>> getAllPosts({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await ApiService.get(
        ApiEndpoints.getAllPosts,
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      final List<dynamic> postsJson = response['posts'];
      return postsJson.map((json) => PostModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to get posts: $e');
    }
  }

  // Get following posts
  static Future<List<PostModel>> getFollowingPosts({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await ApiService.get(
        ApiEndpoints.getFollowingPosts,
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
        requireAuth: true,
      );

      final List<dynamic> postsJson = response['posts'];
      return postsJson.map((json) => PostModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to get following posts: $e');
    }
  }

  // Get single post
  static Future<PostModel> getPost(String postId) async {
    try {
      final response = await ApiService.get(ApiEndpoints.getPost(postId));
      return PostModel.fromJson(response['post']);
    } catch (e) {
      throw Exception('Failed to get post: $e');
    }
  }

  // Like/Unlike post
  static Future<void> toggleLike(String postId) async {
    try {
      await ApiService.post(
        ApiEndpoints.likePost(postId),
        {},
        requireAuth: true,
      );
    } catch (e) {
      throw Exception('Failed to toggle like: $e');
    }
  }

  // Update post
  static Future<PostModel> updatePost(
    String postId, {
    String? description,
    String? purchaseLink,
    String? purchaseAddress,
    double? price,
    int? year,
  }) async {
    try {
      Map<String, dynamic> body = {};
      if (description != null) body['description'] = description;
      if (purchaseLink != null) body['purchaseLink'] = purchaseLink;
      if (purchaseAddress != null) body['purchaseAddress'] = purchaseAddress;
      if (price != null) body['price'] = price;
      if (year != null) body['year'] = year;

      final response = await ApiService.put(
        ApiEndpoints.updatePost(postId),
        body,
        requireAuth: true,
      );

      return PostModel.fromJson(response['post']);
    } catch (e) {
      throw Exception('Failed to update post: $e');
    }
  }

  // Delete post
  static Future<void> deletePost(String postId) async {
    try {
      await ApiService.delete(
        ApiEndpoints.deletePost(postId),
        requireAuth: true,
      );
    } catch (e) {
      throw Exception('Failed to delete post: $e');
    }
  }

  // Get user posts
  static Future<List<PostModel>> getUserPosts(
    String userId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await ApiService.get(
        ApiEndpoints.getUserPosts(userId),
        queryParams: {
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      final List<dynamic> postsJson = response['posts'];
      return postsJson.map((json) => PostModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to get user posts: $e');
    }
  }
}
```

## 🎛️ State Management with Provider

### 1. Authentication Provider

Create `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/firebase_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  // Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Set error
  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Initialize auth state
  Future<void> initializeAuth() async {
    _setLoading(true);

    try {
      final firebaseUser = FirebaseService.getCurrentUser();
      if (firebaseUser != null) {
        _user = await AuthService.getProfile();
      }
    } catch (e) {
      _setError('Failed to initialize authentication');
    } finally {
      _setLoading(false);
    }
  }

  // Register
  Future<bool> register({
    required String email,
    required String password,
    required String username,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      _user = await AuthService.register(
        email: email,
        password: password,
        username: username,
      );
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  // Login
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _setError(null);

    try {
      _user = await AuthService.login(email: email, password: password);
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  // Mock login for development
  Future<bool> mockLogin({required String username}) async {
    _setLoading(true);
    _setError(null);

    try {
      _user = await AuthService.mockLogin(username: username);
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  // Update profile
  Future<bool> updateProfile({required String username}) async {
    _setLoading(true);
    _setError(null);

    try {
      _user = await AuthService.updateProfile(username: username);
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);

    try {
      await AuthService.logout();
      _user = null;
    } catch (e) {
      _setError('Failed to logout');
    } finally {
      _setLoading(false);
    }
  }
}
```

## 📱 Example Screens

### 1. Login Screen

Create `lib/screens/auth/login_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _usernameController = TextEditingController(); // For mock login

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          return Padding(
            padding: EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  if (authProvider.error != null)
                    Container(
                      padding: EdgeInsets.all(8),
                      margin: EdgeInsets.only(bottom: 16),
                      color: Colors.red[100],
                      child: Text(
                        authProvider.error!,
                        style: TextStyle(color: Colors.red[700]),
                      ),
                    ),

                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(labelText: 'Email'),
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'Please enter email';
                      }
                      return null;
                    },
                  ),

                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'Please enter password';
                      }
                      return null;
                    },
                  ),

                  SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _login,
                    child: authProvider.isLoading
                        ? CircularProgressIndicator()
                        : Text('Login'),
                  ),

                  SizedBox(height: 20),

                  // Development mock login
                  Divider(),
                  Text('Development Only'),
                  TextFormField(
                    controller: _usernameController,
                    decoration: InputDecoration(labelText: 'Username (Mock Login)'),
                  ),
                  ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _mockLogin,
                    child: Text('Mock Login'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _login() async {
    if (_formKey.currentState?.validate() ?? false) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      final success = await authProvider.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (success) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }

  void _mockLogin() async {
    if (_usernameController.text.isNotEmpty) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      final success = await authProvider.mockLogin(
        username: _usernameController.text,
      );

      if (success) {
        Navigator.pushReplacementNamed(context, '/home');
      }
    }
  }
}
```

### 2. Posts Feed Screen

Create `lib/screens/home/feed_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/post_model.dart';
import '../../services/post_service.dart';

class FeedScreen extends StatefulWidget {
  @override
  _FeedScreenState createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<PostModel> _posts = [];
  bool _isLoading = false;
  int _currentPage = 1;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      _loadMorePosts();
    }
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);

    try {
      final posts = await PostService.getAllPosts(page: 1, limit: 10);
      setState(() {
        _posts = posts;
        _currentPage = 1;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load posts: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMorePosts() async {
    try {
      final morePosts = await PostService.getAllPosts(
        page: _currentPage + 1,
        limit: 10,
      );

      if (morePosts.isNotEmpty) {
        setState(() {
          _posts.addAll(morePosts);
          _currentPage++;
        });
      }
    } catch (e) {
      print('Failed to load more posts: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('SoulHeads Feed')),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        child: _isLoading && _posts.isEmpty
            ? Center(child: CircularProgressIndicator())
            : ListView.builder(
                controller: _scrollController,
                itemCount: _posts.length,
                itemBuilder: (context, index) {
                  return PostCard(post: _posts[index]);
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/create-post'),
        child: Icon(Icons.add),
      ),
    );
  }
}

class PostCard extends StatelessWidget {
  final PostModel post;

  const PostCard({Key? key, required this.post}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info
          ListTile(
            leading: CircleAvatar(
              backgroundImage: post.user?.profilePhoto.isNotEmpty == true
                  ? CachedNetworkImageProvider(post.user!.profilePhoto)
                  : null,
              child: post.user?.profilePhoto.isEmpty == true
                  ? Icon(Icons.person)
                  : null,
            ),
            title: Text(post.user?.username ?? 'Unknown User'),
            subtitle: Text('${post.brandName} ${post.sneakerName}'),
            trailing: Text(
              '${post.createdAt.day}/${post.createdAt.month}/${post.createdAt.year}',
            ),
          ),

          // Main image
          CachedNetworkImage(
            imageUrl: post.mainImage,
            height: 300,
            width: double.infinity,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              height: 300,
              child: Center(child: CircularProgressIndicator()),
            ),
            errorWidget: (context, url, error) => Container(
              height: 300,
              child: Center(child: Icon(Icons.error)),
            ),
          ),

          // Post details
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.description,
                  style: TextStyle(fontSize: 16),
                ),
                SizedBox(height: 8),
                if (post.price != null)
                  Text(
                    'Price: \$${post.price!.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                SizedBox(height: 8),
                Row(
                  children: [
                    IconButton(
                      onPressed: () => _toggleLike(context),
                      icon: Icon(
                        Icons.favorite,
                        color: Colors.red, // You'd check if user liked this
                      ),
                    ),
                    Text('${post.likeCount} likes'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _toggleLike(BuildContext context) async {
    try {
      await PostService.toggleLike(post.id);
      // You'd update the UI state here
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to like post: $e')),
      );
    }
  }
}
```

## 🚀 Main App Setup

### 1. Main App

Update `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'services/firebase_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/feed_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await FirebaseService.initializeFirebase();

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        // Add other providers here
      ],
      child: MaterialApp(
        title: 'SoulHeads',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: AuthWrapper(),
        routes: {
          '/login': (context) => LoginScreen(),
          '/home': (context) => FeedScreen(),
          // Add other routes
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Initialize auth on first load
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!authProvider.isLoading && authProvider.user == null) {
            authProvider.initializeAuth();
          }
        });

        if (authProvider.isLoading) {
          return Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (authProvider.isAuthenticated) {
          return FeedScreen();
        } else {
          return LoginScreen();
        }
      },
    );
  }
}
```

## 🔧 Testing & Development

### 1. Development Testing

For easier development without Firebase setup:

```dart
// In your login screen, add this button for quick testing:
ElevatedButton(
  onPressed: () async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.mockLogin(username: 'flutter_test_user');
    Navigator.pushReplacementNamed(context, '/home');
  },
  child: Text('Quick Dev Login'),
)
```

### 2. Network Configuration

For Android emulator, use `10.0.2.2` instead of `localhost`:

```dart
static const String baseUrl = 'http://10.0.2.2:5000/api';
```

For iOS simulator, use `localhost`:

```dart
static const String baseUrl = 'http://localhost:5000/api';
```

### 3. Error Handling

Always wrap API calls in try-catch blocks and show user-friendly error messages:

```dart
try {
  final result = await PostService.getAllPosts();
  // Handle success
} catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Something went wrong. Please try again.')),
  );
}
```

## 📝 Production Checklist

Before deploying to production:

1. ✅ Remove all development endpoints and mock login functionality
2. ✅ Update API base URL to your production server
3. ✅ Remove development headers from API service
4. ✅ Set up proper Firebase configuration
5. ✅ Add proper error handling and loading states
6. ✅ Implement proper image caching and optimization
7. ✅ Add offline support with local storage
8. ✅ Implement proper authentication token refresh
9. ✅ Add analytics and crash reporting
10. ✅ Test on both Android and iOS devices

## 🎯 Next Steps

1. **Implement remaining screens**: Profile, Create Post, Search, etc.
2. **Add image picker for post creation**
3. **Implement real-time features** (if needed)
4. **Add push notifications**
5. **Implement offline support**
6. **Add unit and integration tests**
7. **Optimize performance and add caching**

This guide provides a solid foundation for connecting your SoulHeads backend to a Flutter app. The architecture is scalable and follows Flutter best practices.
