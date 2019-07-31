// pages/coupon/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabIndex:1,
    list:[],
    is_weixin:false,
    is_url:false,
  },
  bind_hide:function(){
    this.setData({
      is_weixin:false,
      is_url:false
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    self.not_used();
  },
  //未使用
  not_used:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/spread/account?key='+key,
      method:'GET',
      success:function(res){
        if(res.data.code == 0){
          var list = res.data.data;
          console.log(list);
          self.setData({
            list:list,
          });
        }
        
      }
    })
  },
  block:function(){
    var self = this;
    self.setData({
      is_weixin:false,
      is_url:false,
    });
  },
  none:function(e){
    var id = e.currentTarget.dataset.id;
    var self = this;
    if(id == 1){
      self.setData({
        is_weixin: true,
      });
    }else if( id == 2){
      self.setData({
        is_url: true,
      });
    }
  },
  onShareAppMessage: function (e) {
    var self = this;
    console.log(e);
    var fid = e.target.dataset.fid;
    return {
      title: 'shopDz商城小程序',
      path: '/pages/index/index?fromid=' + fid,
      imageUrl: '/images/logo.png',
      // imageUrl:'http://shopdz.pm.comsenz-service.com/data/Attach/Common/2016-12-15/58521b24ee461.png',
      success: function (res) {
        // 分享成功
        wx.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
        // 分享失败
      }
    }
  },

  /**
   * 长按复制
   */
  copy: function (e) {
    var that = this;
    wx.setClipboardData({
      data: this.data.list.qrcode_url,
      success: function (res) {
        wx.showToast({
          title: '复制成功',
        });
      }
    });
  },
  tishi:function(){
    wx.showToast({
      title: '小程序暂不支持修改账户',
      icon: 'none',
      duration: 2000
    });
  },

  //点击开始的时间  
  timestart: function (e) {
    var _this = this;
    _this.setData({ timestart: e.timeStamp });
  },
  //点击结束的时间
  timeend: function (e) {
    var _this = this;
    _this.setData({ timeend: e.timeStamp });
  },

  //保存图片
  saveImg: function (e) {
    var _this = this;
    var times = _this.data.timeend - _this.data.timestart;
    if (times > 300) {
      console.log("长按");
      wx.getSetting({
        success: function (res) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function (res) {
              console.log("授权成功", _this.data.list.qrcode);
              var imgUrl = _this.data.list.qrcode;
              wx.downloadFile({//下载文件资源到本地，客户端直接发起一个 HTTP GET 请求，返回文件的本地临时路径
                url: imgUrl,
                success: function (res) {
                  // 下载成功后再保存到本地
                  wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,//返回的临时文件路径，下载后的文件会存储到一个临时文件
                    success: function (res) {
                      wx.showToast({
                        title: '成功保存到相册',
                        icon: 'success'
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

})